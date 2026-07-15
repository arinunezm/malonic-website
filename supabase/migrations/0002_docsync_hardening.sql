-- ═══════════════════════════════════════════════════════════════════════
-- Malonic CRM · Fase 1.1 — endurecimiento del doc-sync
-- Correr completo en: Supabase Dashboard → SQL Editor → Run
-- (o `supabase db push` si usas el CLI)
--
-- Qué resuelve:
--   1. `updated_at` lo pone el servidor, no el navegador. Antes el cliente
--      mandaba su propio reloj: con desfase horario el timestamp podía ir
--      hacia atrás y romper la comparación de versiones.
--   2. Realtime en `documents` → los cambios de reservas/clientes hechos en
--      otro dispositivo llegan en vivo, sin recargar.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1 · updated_at autoritativo del servidor.
--    El push del CRM hace compare-and-swap contra este valor (ver cloud.ts):
--      update ... where key = 'malonic-crm' and updated_at = <base>
--    Si otro dispositivo escribió primero, updated_at ya cambió, el UPDATE
--    afecta 0 filas y el cliente detecta el conflicto en vez de pisar.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_touch_updated_at on public.documents;
create trigger documents_touch_updated_at
  before update on public.documents
  for each row
  execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- 2 · Realtime en documents (sync multi-dispositivo en vivo).
--    RLS sigue aplicando: solo perfiles aprobados reciben el payload.
-- ─────────────────────────────────────────────────────────────────────────
do $$
begin
  alter publication supabase_realtime add table public.documents;
exception when duplicate_object then null;
end $$;
