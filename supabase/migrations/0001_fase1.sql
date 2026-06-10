-- ═══════════════════════════════════════════════════════════════════════
-- Malonic CRM · Fase 1 — esquema Supabase
-- Correr completo en: Supabase Dashboard → SQL Editor → Run
-- (o `supabase db push` si usas el CLI)
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- profiles — allowlist de acceso al CRM. Un usuario de Supabase Auth SOLO
-- puede operar si tiene profile con approved=true (se crea manualmente la
-- primera vez; ver docs/FASE1_SUPABASE.md).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'staff' check (role in ('admin', 'staff')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: ¿el usuario autenticado está aprobado?
create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and approved = true
  );
$$;

drop policy if exists "profiles: own row" on public.profiles;
create policy "profiles: own row"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_approved());

-- Sin INSERT/UPDATE desde el cliente: los profiles se administran desde el
-- dashboard (service role) — evita auto-registro de extraños.

-- ─────────────────────────────────────────────────────────────────────────
-- requests — solicitudes del formulario público del sitio.
-- Cualquiera puede INSERTAR (con validaciones); solo aprobados leen/editan.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  project text,
  service text,
  message text,
  status text not null default 'new' check (status in ('new', 'reviewed', 'converted', 'discarded')),
  source text not null default 'web' check (source in ('web', 'manual')),
  created_at timestamptz not null default now()
);

alter table public.requests enable row level security;

drop policy if exists "requests: public insert" on public.requests;
create policy "requests: public insert"
  on public.requests for insert
  to anon, authenticated
  with check (
    status = 'new'
    and source = 'web'
    and char_length(name) between 2 and 120
    and char_length(email) between 5 and 200
    and email like '%@%'
    and (message is null or char_length(message) <= 2000)
    and (project is null or char_length(project) <= 200)
    and (service is null or char_length(service) <= 100)
  );

drop policy if exists "requests: team read" on public.requests;
create policy "requests: team read"
  on public.requests for select
  to authenticated
  using (public.is_approved());

drop policy if exists "requests: team update" on public.requests;
create policy "requests: team update"
  on public.requests for update
  to authenticated
  using (public.is_approved())
  with check (public.is_approved());

create index if not exists requests_status_idx on public.requests (status, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- posts — blog. Publicados legibles por cualquiera; escritura solo equipo.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  body text not null default '',
  cover_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.posts enable row level security;

drop policy if exists "posts: public read published" on public.posts;
create policy "posts: public read published"
  on public.posts for select
  to anon, authenticated
  using (status = 'published' or public.is_approved());

drop policy if exists "posts: team write" on public.posts;
create policy "posts: team write"
  on public.posts for insert
  to authenticated
  with check (public.is_approved());

drop policy if exists "posts: team update" on public.posts;
create policy "posts: team update"
  on public.posts for update
  to authenticated
  using (public.is_approved())
  with check (public.is_approved());

drop policy if exists "posts: team delete" on public.posts;
create policy "posts: team delete"
  on public.posts for delete
  to authenticated
  using (public.is_approved());

create index if not exists posts_published_idx on public.posts (status, published_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- documents — sync del store operativo (clients/services/bookings/
-- activities) como documento JSONB, key fija 'malonic-crm'. Fase 1 usa
-- doc-sync (multi-dispositivo, last-write-wins); la normalización relacional
-- de bookings/clients puede venir en fase 1.5 sin tocar la UI.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.documents (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "documents: team all" on public.documents;
create policy "documents: team all"
  on public.documents for all
  to authenticated
  using (public.is_approved())
  with check (public.is_approved());

-- ─────────────────────────────────────────────────────────────────────────
-- Storage — bucket público de portadas del blog (escritura solo equipo).
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "covers: public read" on storage.objects;
create policy "covers: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'covers');

drop policy if exists "covers: team write" on storage.objects;
create policy "covers: team write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'covers' and public.is_approved());

drop policy if exists "covers: team update" on storage.objects;
create policy "covers: team update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'covers' and public.is_approved());

drop policy if exists "covers: team delete" on storage.objects;
create policy "covers: team delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'covers' and public.is_approved());

-- ─────────────────────────────────────────────────────────────────────────
-- Realtime — para el badge de solicitudes en vivo en el admin.
-- ─────────────────────────────────────────────────────────────────────────
do $$
begin
  alter publication supabase_realtime add table public.requests;
exception when duplicate_object then null;
end $$;
