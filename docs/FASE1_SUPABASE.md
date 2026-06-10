# Fase 1 · Activar Supabase — guía de 10 minutos

El código dual-mode ya está deployado: **sin** las env vars el sitio opera
local-first (como hoy); **con** ellas, el CRM opera contra Supabase. Cero
cambios de UI. Estos son los pasos exactos de activación.

## 1 · Crear el proyecto (3 min)

1. https://supabase.com → New project (org personal, plan Free).
   - Name: `malonic-crm` · Region: `us-east-1` (o la más cercana) · DB password: guárdala.
2. Espera a que el proyecto provisione (~2 min).

## 2 · Esquema (1 min)

1. Dashboard → **SQL Editor** → New query.
2. Pega el contenido completo de [`supabase/migrations/0001_fase1.sql`](../supabase/migrations/0001_fase1.sql) → **Run**.
   - Crea: `profiles`, `requests`, `posts`, `documents`, bucket `covers`, políticas RLS y realtime.

## 3 · Usuario de Nico (2 min)

1. **Authentication → Users → Add user** → email de Nico + contraseña. ✅ "Auto confirm".
2. Copia el UUID del usuario creado.
3. **SQL Editor**:
   ```sql
   insert into public.profiles (id, name, role, approved)
   values ('<UUID-DE-NICO>', 'Nico Malonic', 'admin', true);
   ```
4. ⚠️ **Authentication → Sign In / Up → desactivar "Allow new users to sign up"**
   (el acceso es solo por invitación; sin esto cualquiera podría crear cuenta —
   aunque sin profile aprobado no vería datos, mejor cerrado).

Más usuarios después: repetir 1–3 con `role='staff'`.

## 4 · Conectar el sitio (2 min)

1. Dashboard → **Settings → API**: copia `Project URL` y `anon public` key.
2. Vercel → proyecto `malonic-website` → **Settings → Environment Variables** (Production):
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon key
3. **Deployments → Redeploy** (las env de Vite se inyectan en build).

## 5 · Verificar (2 min)

- `malonic-website.vercel.app/admin` → la card ahora pide **Correo electrónico** → entrar con el usuario de Nico.
- Enviar el form de reservas desde **otro dispositivo/navegador** → debe aparecer en Solicitudes (toast en vivo si el admin está abierto).
- Publicar una entrada de blog → abrir `/blog` en una ventana de incógnito → visible.
- Usuarios → debe listar el profile de Nico ("Accesos en la nube").

## Qué cambia por dentro al activar

| Pieza | Local (hoy) | Nube (activado) |
|---|---|---|
| Solicitudes | localStorage del visitante | tabla `requests` (INSERT público validado) + realtime |
| Blog | localStorage | tabla `posts` (+ portadas en Storage `covers`, URL pública) |
| Operación (clientes/servicios/reservas/actividad) | localStorage | doc JSONB `documents.malonic-crm` con push debounced (multi-dispositivo, last-write-wins) + caché local |
| Acceso | usuarios locales (PBKDF2) | **Supabase Auth** + allowlist `profiles.approved` |
| Usuarios (página) | CRUD local | lectura de profiles; altas en dashboard |
| Borrar todo | disponible | oculto (sería solo caché) |

**Migración de data capturada en local**: el primer login en la nube desde el
navegador que ya tiene data local la **sube automáticamente** (si el documento
nube aún no existe). Si Nico ya capturó cosas en su navegador, hacer ese primer
login DESDE ese navegador.

## Si algo falla
- Login rechazado con credenciales correctas → falta el `insert into profiles … approved=true`.
- Form público no llega → revisar que el SQL corrió completo (políticas de `requests`).
- Portadas no cargan → bucket `covers` debe existir y ser `public` (lo crea el SQL).
