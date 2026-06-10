# Malonic Records — Handover

> Sitio web + CRM de gestión para un estudio Dolby Atmos 7.1.4 en San Pedro
> Garza García, NL. Documento maestro de entrega: qué es, dónde vive, cómo se
> opera y qué sigue.
>
> Última actualización: 10 jun 2026.

---

## 1 · Qué es

Dos productos en un solo repositorio:

1. **Sitio público** (`/`) — landing editorial del estudio: hero, manifiesto,
   sala, equipo, servicios, catálogo y formulario de reservas. Bilingüe (ES/EN).
2. **CRM admin** (`/admin`) — herramienta interna "low-code" para que el equipo
   del estudio administre todo sin programar: solicitudes, reservaciones,
   clientes, servicios/tarifas, blog, analítica y usuarios.
3. **Blog público** (`/blog`) — journal del estudio, alimentado desde el CRM.

El CRM funciona en **dos modos** con el mismo código:
- **Local-first** (sin backend): todo vive en el navegador. Modo de respaldo.
- **Nube (activo en prod)**: Supabase. Las solicitudes de cualquier visitante
  llegan al CRM, el blog es público para todos, y se sincroniza entre
  dispositivos.

---

## 2 · URLs y accesos

| Qué | Dónde |
|---|---|
| Sitio en producción | https://malonic-website.vercel.app |
| Panel admin | https://malonic-website.vercel.app/admin |
| Blog | https://malonic-website.vercel.app/blog |
| Repositorio | https://github.com/arinunezm/malonic-website (público) |
| Dominio (pendiente) | malonicrecords.com → **apunta a Squarespace, NO a Vercel** |

**Acceso al CRM (modo nube):** login con **email + contraseña** vía Supabase Auth.
- Admin actual: `ari@nemo-tech.mx` (la contraseña se entregó por separado; cambiarla en Supabase).
- Solo usuarios con perfil `approved` en Supabase pueden entrar (allowlist).

---

## 3 · Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | Vite + React 19 + TypeScript + Tailwind v4 |
| Animación | motion (framer-motion v12) |
| Hosting | Vercel — auto-deploy en push a `main` |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| Automatización (fase 2) | n8n + WhatsApp Cloud API (infra NeMo) |

**Reglas de trabajo del repo:**
- Trabajar SOLO en `~/dev/malonic-website` (nunca en Desktop/iCloud — rompe `node_modules`).
- `npm run dev` (Vite, puerto 3000) · `npm run build` · `npx tsc --noEmit` (typecheck).
- Push a `main` dispara deploy automático en Vercel.

---

## 4 · Infraestructura

### Vercel
- Proyecto: `malonic-website`, scope `arinunezms-projects`.
- Build: `npm run build` → `dist`. Framework: Vite.
- **Variables de entorno (producción):**
  - `VITE_SUPABASE_URL` = `https://junctcxswqvkvwpqekjc.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = la *publishable key* de Supabase (pública, segura en cliente).
- Si esas dos variables existen → modo nube. Si no → local-first.
- Rewrites de `/admin` y `/blog` a `/` (SPA) en `vercel.json`.

### Supabase
- Proyecto: `malonic-crm`, ref `junctcxswqvkvwpqekjc`, org "Malonic Records" (plan Free).
- URL: `https://junctcxswqvkvwpqekjc.supabase.co`
- **Tablas** (esquema en `supabase/migrations/0001_fase1.sql`):
  - `profiles` — allowlist de acceso (id, name, role admin/staff, approved).
  - `requests` — solicitudes del formulario público (INSERT abierto y validado vía RLS; lectura solo equipo).
  - `posts` — blog (publicados legibles por cualquiera; escritura solo equipo).
  - `documents` — sync del CRM operativo (clientes/servicios/reservas/actividad/ajustes) como un JSONB, key `malonic-crm`.
  - Bucket Storage `covers` — portadas del blog (público lectura, escritura equipo).
  - Realtime activado en `requests` (badge de solicitudes nuevas en vivo).
- **Seguridad:** Row Level Security en todas las tablas. Helper `is_approved()`
  controla el acceso del equipo. La *publishable key* solo permite lo que la
  RLS deja; el *secret key* NUNCA va al sitio (solo a n8n en fase 2).

### GitHub
- `~/dev/malonic-website` → `github.com/arinunezm/malonic-website`.
- Rama de trabajo histórica: `wip-rescate-malonic-admin-2026-06-08`. Producción = `main`.

---

## 5 · Funcionalidades del CRM (`/admin`)

| Sección | Qué hace |
|---|---|
| **Dashboard** | KPIs vivos (sesiones de la semana, facturación, por cobrar, solicitudes nuevas), horas de estudio, bandeja, próximas reservas, actividad. |
| **Solicitudes** | Bandeja del formulario web. Revisar / **convertir en reserva** (prefill) / descartar. Badge de nuevas + aviso en tiempo real. |
| **Reservaciones** | CRUD completo: crear, editar, confirmar, completar, marcar pagada, eliminar. |
| **Calendario** | Ocupación semanal real, navegable por semana (hoy resaltado), click en bloque para editar. |
| **Clientes** | Directorio con contacto; stats calculadas (sesiones, facturado, última visita). Auto-alta al reservar. |
| **Blog** | Editor con título, resumen, contenido, **foto de portada** (se redimensiona sola), tags, slug. Borrador / publicar. Lo publicado sale en `/blog`. |
| **Analítica** | Facturación 6 meses, ocupación por sala (dona), ingresos por servicio, embudo solicitudes→completadas, top clientes, cobranza. Todo de data real. |
| **Servicios & tarifas** | CRUD de catálogo (tarifa, unidad, sala, Atmos, activo). Botón "cargar catálogo base" con los precios reales del sitio. |
| **Usuarios** | Gestión de accesos. En nube = lectura de perfiles (altas en Supabase). |
| **Datos** | Respaldo export/import JSON, medidor de almacenamiento, y **teléfono de notificaciones WhatsApp** editable. |

---

## 6 · Arquitectura del código

```
src/
  App.tsx                  Router (site / admin / blog), code-splitting lazy
  lib/
    admin-store.ts         Capa de datos local-first + tipos + métricas (fuente de verdad de tipos)
    supabase.ts            Cliente Supabase (singleton por env vars)
    cloud.ts               Adaptadores tipados a Supabase (auth, requests, posts, doc-sync)
    cloud-env.ts           Flag de modo nube sin importar supabase-js
  sections/
    Admin.tsx              Shell del CRM: access card 3D, sidebar, topbar, mobile-nav, router de páginas
    Blog.tsx               Blog público (/blog, /blog/:slug) — lee de la nube o local
    admin/
      AdminContext.tsx     Estado global + todas las mutaciones (dual-mode local/nube)
      AdminUI.tsx          Vocabulario visual: cards, pills, charts (SVG puro), modal, toast
      icons.tsx            Set de íconos inline
      AdminOperations.tsx  Solicitudes, Reservaciones, Calendario, modal de reserva
      AdminInsights.tsx    Dashboard + Analítica
      AdminCatalog.tsx     Clientes + Servicios/tarifas
      AdminContent.tsx     Blog (editor)
      AdminSystem.tsx      Usuarios + Datos/respaldo + Notificaciones
supabase/migrations/0001_fase1.sql   Esquema completo de la nube
automation/n8n/*.json                Workflows de WhatsApp (fase 2)
docs/                                Documentación detallada (ver §9)
```

**Principio clave:** toda la persistencia pasa por `admin-store.ts` (local) y
`cloud.ts` (nube). El modo se decide por las env vars — la UI no cambia.

---

## 7 · Operación diaria (rutina del estudio, ~10 min/día)

**Mañana:** abrir `/admin` → el badge de **Solicitudes** dice si llegó algo del
sitio → convertir en reserva o responder por mail. Revisar el **Calendario** del
día; confirmar pendientes al recibir depósito.

**Cierre:** sesión terminada → *Marcar completada*; pago liquidado → *Marcar pagada*.

**Viernes (5 min):** **Analítica** → revisar "Por cobrar" y "Vencido"; cobrar.
**Datos → Descargar respaldo** (sano hacerlo aunque haya nube).

**Cuando haya material:** una entrada de **Blog** por sesión destacada (foto + 3 párrafos) — SEO + prueba social sin tocar el sitio.

---

## 8 · Seguridad

- **Modo nube (prod):** Supabase Auth (email + contraseña), allowlist por
  `profiles.approved`, Row Level Security en todas las tablas. El formulario
  público solo puede INSERTAR solicitudes validadas; no leer nada.
- **Modo local:** contraseñas con PBKDF2-SHA256 (100k iteraciones) + salt.
- Headers de seguridad en `vercel.json` (nosniff, X-Frame-Options, Referrer-Policy).
- El *secret key* de Supabase nunca toca el frontend (solo n8n en fase 2).
- **Pendiente recomendado:** header CSP (Content-Security-Policy).

---

## 9 · Documentación detallada (en `/docs`)

| Archivo | Contenido |
|---|---|
| `docs/AUDITORIA_2026-06-09.md` | QA E2E (17 flujos), análisis de seguridad/UX, corregido vs. pendiente. |
| `docs/OPERACION_LOW_CODE.md` | Rutina de operación + roadmap de automatización. |
| `docs/FASE1_SUPABASE.md` | Activación de la nube paso a paso (ya ejecutado). |
| `docs/FASE2_N8N.md` | Instalación de los workflows de WhatsApp. |

---

## 10 · Roadmap — Fase 2 (automatización, lista en repo)

Cuatro workflows en `automation/n8n/` (JSON importables) que leen Supabase y
avisan por WhatsApp a un número configurable desde `/admin → Datos`:

1. **Solicitud nueva → WhatsApp** inmediato (webhook de Supabase).
2. **Recordatorio diario 18:00** — sesiones de mañana.
3. **Cobranza lunes 9:00** — cuentas abiertas, vencidos primero.
4. **Resumen semanal (viernes)** — facturación, horas, por cobrar.

Requiere: acceso al VPS de NeMo (donde corre n8n) + la WhatsApp Cloud API ya
aprobada + crear una plantilla `malonic_notificacion`. ~15 min de instalación
manual con la guía `docs/FASE2_N8N.md`.

---

## 11 · Pendientes y decisiones abiertas

- [ ] **DNS de `malonicrecords.com`**: hoy apunta a Squarespace (parking). Para
      servir el sitio de Vercel hay que cambiar el DNS en el registrar
      (A `76.76.21.21` / CNAME `cname.vercel-dns.com`). Decisión del cliente.
- [ ] **Cambiar la contraseña temporal** de `ari@nemo-tech.mx` (vía Supabase → recovery).
- [ ] **Dar acceso a Nico**: Supabase → Auth → crear usuario + insertar su perfil `approved` (ver `docs/FASE1_SUPABASE.md`).
- [ ] **Fase 2** (WhatsApp): instalar cuando haya acceso al VPS.
- [ ] **Header CSP** (recomendado en la auditoría).

---

## 12 · Gotchas (cosas que muerden)

- **iCloud rompe `node_modules`** — trabajar siempre en `~/dev`, nunca en Desktop.
- **`malonicrecords.com` no es Vercel** — el sitio vive en `malonic-website.vercel.app` hasta cambiar el DNS.
- **No reintroducir `AnimatePresence mode="wait"`** para swaps de pantallas
  completas en el admin: con motion v12 + React 19 dejaba overlays invisibles
  que bloqueaban la UI. Todo usa render condicional con animación de entrada.
- **Supabase Site URL** debe ser `https://malonic-website.vercel.app` (ya
  configurado) — si vuelve a `localhost`, los emails de recuperación fallan.
