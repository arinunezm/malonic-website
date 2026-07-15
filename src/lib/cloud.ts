/**
 * Adaptadores Supabase tipados — única frontera entre el CRM y la nube.
 *
 * Diseño fase 1:
 *  - `requests` y `posts` viven en sus propias tablas (tienen lectores /
 *    escritores públicos). El admin las hidrata a su estado en memoria.
 *  - El resto del store operativo (clients/services/bookings/activities)
 *    se sincroniza como documento JSONB (`documents.key = 'malonic-crm'`):
 *    multi-dispositivo con last-write-wins, cero cambio de UI.
 *  - Toda función devuelve datos en los tipos de admin-store; los errores
 *    se lanzan con mensaje legible para que el caller decida (toast).
 */

import { getSupabase } from './supabase';
import {
  uid,
  type Activity,
  type BlogPost,
  type Booking,
  type Client,
  type CrmSettings,
  type RequestStatus,
  type Role,
  type Service,
  type StoreData,
  type WebRequest,
} from './admin-store';

const sb = () => {
  const c = getSupabase();
  if (!c) throw new Error('Supabase no configurado');
  return c;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Auth
 * ───────────────────────────────────────────────────────────────────────── */

export type CloudUser = { id: string; email: string; name: string; role: Role };

export async function cloudSignIn(email: string, password: string): Promise<CloudUser | null> {
  const { data, error } = await sb().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error || !data.user) return null;
  const profile = await cloudFetchProfile(data.user.id);
  if (!profile) {
    // Autenticado pero sin profile aprobado → sin acceso al CRM.
    await sb().auth.signOut();
    return null;
  }
  return { id: data.user.id, email: data.user.email ?? email, ...profile };
}

export async function cloudSignOut(): Promise<void> {
  await sb().auth.signOut();
}

export async function cloudSession(): Promise<CloudUser | null> {
  const { data } = await sb().auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  const profile = await cloudFetchProfile(user.id);
  if (!profile) return null;
  return { id: user.id, email: user.email ?? '', ...profile };
}

export type CloudProfile = { id: string; name: string; role: Role; createdAt: string };

/** Lista de profiles del equipo (solo aprobados pueden leerla). */
export async function cloudFetchProfiles(): Promise<CloudProfile[]> {
  const { data, error } = await sb()
    .from('profiles')
    .select('id, name, role, created_at')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as { id: string; name: string; role: Role; created_at: string }[]).map((p) => ({
    id: p.id,
    name: p.name || 'Equipo Malonic',
    role: p.role,
    createdAt: p.created_at,
  }));
}

/* Gestión de usuarios desde el dashboard (vía Edge Function `admin-users`,
 * que valida que el caller es admin y usa el service_role del lado servidor). */

async function callAdminUsers(body: Record<string, unknown>): Promise<void> {
  const { data, error } = await sb().functions.invoke('admin-users', { body });
  if (error) {
    // La Edge Function devuelve { error } con status !=2xx → viene en context.
    let msg = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        const j = await ctx.json();
        if (j?.error) msg = j.error;
      }
    } catch { /* usa error.message */ }
    throw new Error(msg);
  }
  if (data && (data as { error?: string }).error) throw new Error((data as { error: string }).error);
}

export const cloudCreateUser = (name: string, email: string, password: string, role: Role) =>
  callAdminUsers({ action: 'create', name, email, password, role });

export const cloudDeleteUserAccount = (userId: string) =>
  callAdminUsers({ action: 'delete', userId });

export const cloudResetUserPassword = (userId: string, password: string) =>
  callAdminUsers({ action: 'reset-password', userId, password });

async function cloudFetchProfile(userId: string): Promise<{ name: string; role: Role } | null> {
  const { data, error } = await sb()
    .from('profiles')
    .select('name, role, approved')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data || !data.approved) return null;
  return { name: data.name || 'Equipo Malonic', role: (data.role as Role) ?? 'staff' };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Requests
 * ───────────────────────────────────────────────────────────────────────── */

type RequestRow = {
  id: string;
  name: string;
  email: string;
  project: string | null;
  service: string | null;
  message: string | null;
  status: RequestStatus;
  source: 'web' | 'manual';
  created_at: string;
};

const rowToRequest = (r: RequestRow): WebRequest => ({
  id: r.id,
  name: r.name,
  email: r.email,
  project: r.project ?? undefined,
  service: r.service ?? undefined,
  message: r.message ?? undefined,
  status: r.status,
  source: r.source,
  createdAt: r.created_at,
});

/** INSERT público (form del sitio). Lanza si falla — el caller hace fallback local. */
export async function cloudSubmitRequest(input: {
  name: string;
  email: string;
  project?: string;
  service?: string;
  message?: string;
}): Promise<void> {
  const { error } = await sb().from('requests').insert({
    name: input.name.trim(),
    email: input.email.trim(),
    project: input.project?.trim() || null,
    service: input.service || null,
    message: input.message?.trim() || null,
    status: 'new',
    source: 'web',
  });
  if (error) throw new Error(error.message);
}

export async function cloudFetchRequests(): Promise<WebRequest[]> {
  const { data, error } = await sb()
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data as RequestRow[]).map(rowToRequest);
}

export async function cloudUpdateRequestStatus(id: string, status: RequestStatus): Promise<void> {
  const { error } = await sb().from('requests').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Suscripción realtime a solicitudes nuevas. Devuelve unsubscribe. */
export function cloudOnNewRequest(fn: (req: WebRequest) => void): () => void {
  const channel = sb()
    .channel('crm-requests')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (payload) => {
      fn(rowToRequest(payload.new as RequestRow));
    })
    .subscribe();
  return () => {
    void sb().removeChannel(channel);
  };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Posts + portadas
 * ───────────────────────────────────────────────────────────────────────── */

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_url: string | null;
  tags: string[];
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

const rowToPost = (r: PostRow): BlogPost => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  excerpt: r.excerpt,
  body: r.body,
  cover: r.cover_url ?? undefined,
  tags: r.tags ?? [],
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  publishedAt: r.published_at ?? undefined,
});

/** Sube una portada (dataURL JPEG) al bucket público; devuelve URL https. */
export async function cloudUploadCover(dataUrl: string, postId: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${postId}-${uid().slice(0, 8)}.jpg`;
  const { error } = await sb().storage.from('covers').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return sb().storage.from('covers').getPublicUrl(path).data.publicUrl;
}

export async function cloudUpsertPost(post: BlogPost): Promise<BlogPost> {
  // Portada como dataURL → subir a Storage y guardar URL.
  let coverUrl = post.cover ?? null;
  if (coverUrl?.startsWith('data:')) {
    coverUrl = await cloudUploadCover(coverUrl, post.id);
  }
  const { data, error } = await sb()
    .from('posts')
    .upsert({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body: post.body,
      cover_url: coverUrl,
      tags: post.tags,
      status: post.status,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      published_at: post.publishedAt ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToPost(data as PostRow);
}

export async function cloudDeletePost(id: string): Promise<void> {
  const { error } = await sb().from('posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Todas las entradas (equipo autenticado): borradores incluidos. */
export async function cloudFetchAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await sb().from('posts').select('*').order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as PostRow[]).map(rowToPost);
}

/** Publicadas (lector anónimo del sitio). */
export async function cloudFetchPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await sb()
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as PostRow[]).map(rowToPost);
}

export async function cloudFetchPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await sb().from('posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToPost(data as PostRow) : null;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Document sync — store operativo (sin posts/requests, que tienen tabla).
 * ───────────────────────────────────────────────────────────────────────── */

const DOC_KEY = 'malonic-crm';

export type OperationalDoc = {
  clients: Client[];
  services: Service[];
  bookings: Booking[];
  activities: Activity[];
  settings: CrmSettings;
};

export const operationalOf = (s: StoreData): OperationalDoc => ({
  clients: s.clients,
  services: s.services,
  bookings: s.bookings,
  activities: s.activities,
  settings: s.settings,
});

const normalizeDoc = (raw: unknown): OperationalDoc => {
  const d = (raw ?? {}) as Partial<OperationalDoc>;
  return {
    clients: Array.isArray(d.clients) ? d.clients : [],
    services: Array.isArray(d.services) ? d.services : [],
    bookings: Array.isArray(d.bookings) ? d.bookings : [],
    activities: Array.isArray(d.activities) ? d.activities : [],
    settings: d.settings && typeof d.settings === 'object' ? d.settings : {},
  };
};

export async function cloudPullDocument(): Promise<{ doc: OperationalDoc; updatedAt: string } | null> {
  const { data, error } = await sb().from('documents').select('data, updated_at').eq('key', DOC_KEY).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { doc: normalizeDoc(data.data), updatedAt: data.updated_at as string };
}

/**
 * Resultado del push. `conflict` = otro dispositivo escribió después de
 * nuestra última hidratación; el caller decide (avisar / recargar), nunca
 * se pisa en silencio.
 */
export type PushResult =
  | { status: 'saved'; updatedAt: string }
  | { status: 'conflict'; remoteUpdatedAt: string | null; remoteDoc: OperationalDoc | null };

/**
 * Compare-and-swap contra `documents.updated_at`.
 *
 * `base` = el updated_at que este dispositivo cree que está en la nube
 * (null = todavía no existe la fila). El UPDATE solo pega si nadie escribió
 * en medio; si afecta 0 filas hay conflicto. El nuevo updated_at lo pone el
 * trigger del servidor (migración 0002), no el reloj del navegador.
 */
export async function cloudPushDocument(doc: OperationalDoc, base: string | null): Promise<PushResult> {
  if (base === null) {
    const { data, error } = await sb().from('documents').insert({ key: DOC_KEY, data: doc }).select('updated_at').maybeSingle();
    // 23505 = unique_violation: otro dispositivo creó la fila primero.
    if (error?.code === '23505') {
      const remote = await cloudPullDocument().catch(() => null);
      return { status: 'conflict', remoteUpdatedAt: remote?.updatedAt ?? null, remoteDoc: remote?.doc ?? null };
    }
    if (error) throw new Error(error.message);
    return { status: 'saved', updatedAt: data!.updated_at as string };
  }

  const { data, error } = await sb()
    .from('documents')
    .update({ data: doc })
    .eq('key', DOC_KEY)
    .eq('updated_at', base)
    .select('updated_at')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    const remote = await cloudPullDocument().catch(() => null);
    return { status: 'conflict', remoteUpdatedAt: remote?.updatedAt ?? null, remoteDoc: remote?.doc ?? null };
  }
  return { status: 'saved', updatedAt: data.updated_at as string };
}

/** Igualdad por contenido del documento (no por referencia). */
export const sameDoc = (a: OperationalDoc, b: OperationalDoc): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/** Suscripción realtime al documento operativo. Devuelve unsubscribe. */
export function cloudOnDocumentChange(fn: (doc: OperationalDoc, updatedAt: string) => void): () => void {
  const channel = sb()
    .channel('crm-document')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'documents', filter: `key=eq.${DOC_KEY}` },
      (payload) => {
        const row = payload.new as { data?: unknown; updated_at?: string } | null;
        if (!row?.data || !row.updated_at) return;
        fn(normalizeDoc(row.data), row.updated_at);
      },
    )
    .subscribe();
  return () => {
    void sb().removeChannel(channel);
  };
}
