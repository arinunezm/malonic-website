/**
 * Check de modo nube SIN importar supabase-js (cero costo en el bundle
 * del sitio marketing). La carga real del cliente es lazy en cloud.ts.
 */
export const cloudConfigured: boolean = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);
