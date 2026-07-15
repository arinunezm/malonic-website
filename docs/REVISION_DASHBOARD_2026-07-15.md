# Revisión técnica — Dashboard / Analítica + Base de datos
> 15 jul 2026 · Pruebas en vivo contra Supabase (`junctcxswqvkvwpqekjc`) y producción (`www.malonicrecords.com`).

---

## 1 · Resultado de las pruebas

| Prueba | Resultado |
|---|---|
| Supabase Auth (`/auth/v1/health`) | ✅ 200 — proyecto activo |
| REST API con publishable key | ✅ 200 |
| RLS: lectura anónima de `requests` / `documents` / `profiles` | ✅ Bloqueada (arrays vacíos) |
| RLS: INSERT inválido (email malo) en `requests` | ✅ Rechazado `42501` |
| RLS: INSERT con `status`/`source` manipulados | ✅ Rechazado `42501` |
| RLS: UPDATE anónimo en `requests` | ✅ 0 filas afectadas |
| Formulario público (INSERT válido en `requests`) | ✅ 201 — flujo sitio→CRM funciona de extremo a extremo |
| Edge Function `admin-users` sin sesión | ✅ 401 "No autenticado" — desplegada y protegida |
| Storage bucket `covers` (lectura pública) | ✅ Existe y responde |
| Modo nube en producción | ✅ URL de Supabase presente en `cloud-*.js` del deploy |
| Dominio | ✅ `www.malonicrecords.com` ya sirve desde Vercel (pendiente del handover resuelto) |
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run build` | ✅ 2.15s, admin/blog con lazy-loading correcto |
| Headers de seguridad en prod | ✅ HSTS, nosniff, X-Frame, Referrer-Policy · ❌ falta CSP |
| Métricas de analítica (`admin-store.ts`) | ✅ Coherentes: facturación = confirmadas+completadas; cobranza excluye canceladas/pagadas |
| `.env.local` en git | ✅ Nunca se commiteó (repo público, sin exposición) |

**Nota:** la prueba del formulario dejó una solicitud `PRUEBA TECNICA — descartar`
en la bandeja del CRM. Descartarla desde `/admin → Solicitudes`.

## 2 · Riesgos detectados (orden de prioridad)

1. **Pérdida silenciosa en doc-sync.** Los cambios operativos (reservas, clientes,
   servicios) se suben con debounce de 800 ms y *last-write-wins*. Si se cierra la
   pestaña antes del push, o dos dispositivos editan a la vez, un lado se pierde y
   la siguiente hidratación pisa lo local sin avisar.
2. **Sin reintento al fallar el push.** Solo muestra toast; el cambio queda local
   hasta la siguiente mutación.
3. **Plan Free de Supabase se pausa tras ~1 semana sin actividad.** Si se pausa,
   el formulario del sitio cae al fallback local del visitante → solicitud perdida.
4. **Realtime solo en `requests`.** Cambios de otro dispositivo en reservas/clientes
   no se reflejan hasta recargar.
5. **Sin respaldo automático.** Export JSON manual; el plan Free no tiene PITR.

## 3 · Mejoras recomendadas

**Corto plazo (horas de trabajo):**
- Push inmediato en `beforeunload` / `visibilitychange` (cierra el hueco del debounce).
- Comparar `updated_at` antes de pisar el documento → detectar conflicto y avisar.
- Keep-alive del proyecto Supabase (cron semanal en n8n o Vercel Cron).
- Header `Content-Security-Policy` en `vercel.json` (pendiente de la auditoría de junio).
- **Analítica web del sitio público**: hoy la "Analítica" solo mide el CRM. Con
  Vercel Analytics o Plausible + evento de envío del formulario se completa el
  embudo visita → solicitud → reserva (dato clave para la propuesta del sitio).

**Mediano plazo:**
- Respaldo automático semanal de las 4 tablas (workflow n8n adicional o GitHub Action).
- Realtime en `documents` para sync multi-dispositivo en vivo.
- Fase 1.5: normalizar `bookings`/`clients` a tablas relacionales (el JSONB crece sin límite).
- Fase 2 (WhatsApp/n8n): los 4 workflows ya están listos en `automation/n8n/`.

**Operativo (del handover, siguen abiertos):**
- Cambiar la contraseña temporal de `ari@nemo-tech.mx`.
- Dar de alta a Nico (`profiles.approved`).
- Publicar la primera entrada del blog — `/blog` funciona pero está vacío (SEO desaprovechado).

---

## 4 · Qué se aplicó (15 jul 2026)

| Riesgo | Cambio | Archivo |
|---|---|---|
| **Bug no reportado**: restaurar respaldo se perdía | En modo nube la restauración ahora se sube (push forzado, re-basado contra la nube) y re-sube el blog. Antes solo entraba a la pantalla y la siguiente hidratación la pisaba en silencio | `AdminContext.tsx` |
| 1 · Hueco del debounce | Flush inmediato en `visibilitychange`/`pagehide`, y `beforeunload` avisa si algo quedó sin subir | `AdminContext.tsx` |
| 1 · Last-write-wins | Compare-and-swap contra `documents.updated_at`: si otro dispositivo escribió primero el UPDATE afecta 0 filas y se avisa, no se pisa | `cloud.ts`, `0002` |
| 2 · Sin reintento | Backoff exponencial (5 intentos, tope 30 s) + toast; distingue el fallo de red del conflicto real | `AdminContext.tsx` |
| 3 · Proyecto Free se pausa | Vercel Cron diario (08:00 CDMX) que hace una lectura a Supabase | `api/keepalive.ts`, `vercel.json` |
| 4 · Realtime solo en requests | Realtime en `documents`: los cambios de otro dispositivo entran en vivo (no pisan si hay cambios locales sin subir) | `cloud.ts`, `0002` |
| Falta CSP | `Content-Security-Policy` completo, **probado en el build real** (permite Supabase REST+wss y Analytics; bloquea todo lo demás) | `vercel.json` |
| Analítica web | Vercel Analytics en las páginas públicas (no en `/admin`) + evento `solicitud_enviada` con `destino` (`nube`/`local`) — delata cuándo una solicitud NO llegó al CRM | `App.tsx`, `Booking.tsx` |

**Casos límite cubiertos en el doc-sync:**
- Cambio que entra mientras un push está en vuelo → se sube después, no espera otra mutación.
- Push que llega al servidor pero pierde la respuesta → el reintento compara contenido y adopta la versión en vez de marcar conflicto falso.
- Conflicto real → NO se re-basa a propósito: re-basar haría que la siguiente edición pisara al otro dispositivo en silencio.

**Limitación conocida:** ante conflicto real el CRM deja de subir hasta recargar (avisa en cada intento). Es deliberado — la alternativa era perder los cambios del otro dispositivo sin avisar. La salida es exportar respaldo y recargar.

## 5 · Estado de la infraestructura

**Hecho y verificado en vivo (15 jul 2026):**
- ✅ **Migración `0002` aplicada** en producción vía SQL Editor. Verificada por catálogo
  (función, trigger y `documents` en `supabase_realtime` = 1) y **funcionalmente**: fila
  desechable insertada con `updated_at = 2000-01-01` → tras un UPDATE quedó en
  `2026-07-15 16:01:48.807424+00`. El compare-and-swap tiene base real con precisión de
  microsegundos. Fila de prueba borrada; solo queda `malonic-crm` intacto.
- ✅ **Web Analytics activado** en Vercel (plan Hobby, sin cargo).

**Pendientes:**
1. **`CRON_SECRET`** como env var en Vercel (opcional, recomendado). Generar con
   `openssl rand -hex 32`. El keep-alive lo exige si está presente y funciona si no.
2. **Respaldo automático semanal.** El repo es **público**, así que artifacts de GitHub
   Actions quedan descartados (expondrían datos de clientes). Destino natural: n8n del
   VPS → OneDrive, como Tab & Kit.

**Limitación del plan Hobby:** los *custom events* son de plan Pro ($20/mes). El evento
`solicitud_enviada` está en el código pero **no registra** en Hobby (no falla, se ignora).
Los pageviews, rutas y referrers sí funcionan. Al subir a Pro empieza a medir solo.

**No verificado en vivo:** el doc-sync autenticado (CAS, realtime, restauración) requiere
sesión de Supabase; se validó por tipos, build y lectura, más la prueba funcional del
trigger en la base. Lo probado contra la base real: proyecto activo, RLS, políticas del
formulario, Edge Function y blog público (10/10). El CSP se probó sirviendo el build con
los headers reales: Supabase REST y `wss` pasan, un origen prohibido se bloquea.
