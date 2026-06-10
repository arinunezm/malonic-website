/**
 * Cliente Supabase — singleton desde variables de entorno.
 *
 * Dual-mode: si VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no existen,
 * `getSupabase()` devuelve null y TODO el sitio opera en modo local-first
 * (localStorage), exactamente como antes de la fase 1. Activar la nube =
 * setear las dos env vars en Vercel y redeploy. Ver docs/FASE1_SUPABASE.md.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  client = url && anon ? createClient(url, anon) : null;
  return client;
}

/** true cuando el deploy tiene Supabase configurado (modo nube). */
export const isCloud = (): boolean => getSupabase() !== null;
