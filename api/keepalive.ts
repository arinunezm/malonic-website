/**
 * Keep-alive del proyecto Supabase (plan Free).
 *
 * El plan Free pausa el proyecto tras ~7 días sin actividad. Si se pausa, el
 * formulario del sitio cae al fallback local del visitante y esa solicitud
 * nunca llega al CRM — pérdida silenciosa. Una lectura diaria basta como
 * actividad. Lo dispara Vercel Cron (ver `crons` en vercel.json).
 *
 * Solo lee (`select id limit 1` sobre `posts`, tabla con lectura pública):
 * no necesita service role ni toca datos.
 */

type Req = { headers: Record<string, string | string[] | undefined> };
type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
};

export default async function handler(req: Req, res: Res): Promise<void> {
  // Vercel Cron manda `Authorization: Bearer $CRON_SECRET` cuando la env var
  // existe. Sin el secreto el endpoint queda abierto: no expone datos, pero
  // cualquiera podría llamarlo, así que si está configurado lo exigimos.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(503).json({ error: 'Supabase no configurado (faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)' });
    return;
  }

  try {
    const r = await fetch(`${url}/rest/v1/posts?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) {
      res.status(502).json({ ok: false, supabaseStatus: r.status, body: (await r.text()).slice(0, 200) });
      return;
    }
    res.status(200).json({ ok: true, pinged: new Date().toISOString() });
  } catch (e) {
    res.status(502).json({ ok: false, error: e instanceof Error ? e.message : 'fetch falló' });
  }
}
