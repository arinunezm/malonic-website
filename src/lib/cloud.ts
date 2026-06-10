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

export async function cloudPullDocument(): Promise<{ doc: OperationalDoc; updatedAt: string } | null> {
  const { data, error } = await sb().from('documents').select('data, updated_at').eq('key', DOC_KEY).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const d = data.data as Partial<OperationalDoc>;
  return {
    doc: {
      clients: Array.isArray(d.clients) ? d.clients : [],
      services: Array.isArray(d.services) ? d.services : [],
      bookings: Array.isArray(d.bookings) ? d.bookings : [],
      activities: Array.isArray(d.activities) ? d.activities : [],
      settings: d.settings && typeof d.settings === 'object' ? d.settings : {},
    },
    updatedAt: data.updated_at as string,
  };
}

export async function cloudPushDocument(doc: OperationalDoc): Promise<void> {
  const { error } = await sb()
    .from('documents')
    .upsert({ key: DOC_KEY, data: doc, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
