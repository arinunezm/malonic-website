// Edge Function · admin-users
// Crea / elimina / resetea usuarios del CRM desde el dashboard.
//
// Seguridad: el service_role vive SOLO aquí (Supabase lo inyecta como env var
// en Edge Functions; nunca toca el navegador). Antes de cualquier acción se
// verifica que quien llama esté autenticado Y sea admin aprobado.
//
// Deploy: Supabase Dashboard → Edge Functions → Deploy a new function →
// nombre "admin-users" → pegar este archivo. (Sin secretos extra: SUPABASE_URL,
// SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY existen por defecto.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    // 1) ¿Quién llama? (su propio JWT)
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: who, error: whoErr } = await caller.auth.getUser();
    if (whoErr || !who?.user) return json({ error: 'No autenticado.' }, 401);

    // 2) ¿Es admin aprobado? (con service_role, lectura confiable)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: me } = await admin
      .from('profiles')
      .select('role, approved')
      .eq('id', who.user.id)
      .maybeSingle();
    if (!me || !me.approved || me.role !== 'admin') {
      return json({ error: 'Solo un administrador puede gestionar usuarios.' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? 'create';

    // ── CREAR ────────────────────────────────────────────────────────────
    if (action === 'create') {
      const name = String(body.name ?? '').trim();
      const email = String(body.email ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');
      const role = body.role === 'admin' ? 'admin' : 'staff';
      if (name.length < 2) return json({ error: 'Escribe el nombre.' }, 400);
      if (!email.includes('@')) return json({ error: 'Correo inválido.' }, 400);
      if (password.length < 6) return json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);

      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (cErr || !created?.user) {
        const msg = cErr?.message ?? 'No se pudo crear el usuario.';
        return json({ error: /already|registered|exists/i.test(msg) ? 'Ese correo ya tiene cuenta.' : msg }, 400);
      }
      const { error: pErr } = await admin
        .from('profiles')
        .insert({ id: created.user.id, name, role, approved: true });
      if (pErr) {
        await admin.auth.admin.deleteUser(created.user.id); // rollback
        return json({ error: pErr.message }, 400);
      }
      return json({ ok: true });
    }

    // ── ELIMINAR ─────────────────────────────────────────────────────────
    if (action === 'delete') {
      const userId = String(body.userId ?? '');
      if (!userId) return json({ error: 'Falta el usuario.' }, 400);
      if (userId === who.user.id) return json({ error: 'No puedes eliminar tu propia cuenta.' }, 400);
      const { data: target } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
      if (target?.role === 'admin') {
        const { count } = await admin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin')
          .eq('approved', true);
        if ((count ?? 0) <= 1) return json({ error: 'Debe existir al menos un administrador.' }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(userId); // cascade borra el profile
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ── RESET CONTRASEÑA ─────────────────────────────────────────────────
    if (action === 'reset-password') {
      const userId = String(body.userId ?? '');
      const password = String(body.password ?? '');
      if (!userId) return json({ error: 'Falta el usuario.' }, 400);
      if (password.length < 6) return json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: 'Acción desconocida.' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
