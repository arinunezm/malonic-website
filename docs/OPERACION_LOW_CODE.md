# Operar Malonic con low-code — guía y roadmap

Cómo administrar el estudio con el CRM actual de la forma más simple posible,
y cómo automatizarlo por fases sin construir (casi) nada a la medida.
Principio rector: **el CRM es la fuente de verdad operativa; todo lo demás se
conecta a él, no al revés.**

---

## 0 · La rutina de Nico hoy (sin backend, 10 min/día)

**Diario (mañana):**
1. Abrir `/admin` → el badge de **Solicitudes** dice si llegó algo del sitio*.
2. Solicitud nueva → *Convertir en reserva* (queda pre-llenada) o responder
   por mail con un click (*Responder ↗*).
3. Revisar **Calendario** del día; confirmar pendientes al recibir depósito
   (botón ✓ en la fila, o editar y capturar el depósito).

**Diario (cierre):**
4. Sesión terminada → *Marcar completada*; pago liquidado → *Marcar pagada*.

**Semanal (viernes, 5 min):**
5. **Analítica** → revisar "Por cobrar" y "Vencido"; cobrar lo que aparezca.
6. **Datos & respaldo → Descargar respaldo** y guardarlo en Drive/iCloud.
   *Este paso es sagrado mientras no haya backend.*

**Cuando haya material:** una entrada de **Blog** por sesión destacada
(foto + 3 párrafos). SEO + prueba social sin tocar el sitio.

\* Limitación actual: las solicitudes del formulario solo llegan si se envían
desde el mismo navegador (no hay servidor). Mientras tanto, el mail
`info@malonicrecords.com` sigue siendo el canal real de entrada — la bandeja
demuestra el flujo y queda lista para la fase 1.

---

## 1 · Fase 1 — Backend low-code: Supabase (1–2 días de trabajo)

**Por qué Supabase**: Postgres administrado + Auth + Storage + API REST
automática, plan gratis sobrado para Malonic, y el CRM ya está diseñado para
el swap — toda la persistencia pasa por `src/lib/admin-store.ts`.

**Mapeo directo de tablas** (los tipos ya existen en `admin-store.ts`):

| Tabla | Origen | Nota |
|---|---|---|
| `users` | `UserAccount` | Sustituir por **Supabase Auth** (email+password, invitaciones) |
| `clients` | `Client` | RLS: solo usuarios autenticados |
| `services` | `Service` | RLS: lectura pública opcional (el sitio podría leer precios) |
| `bookings` | `Booking` | RLS: solo autenticados |
| `posts` | `BlogPost` | Lectura pública de `status='published'`; portadas → **Storage** (deja de pesar en el cliente) |
| `requests` | `WebRequest` | **INSERT público** (el form del sitio escribe directo) + rate-limit |
| `activities` | `Activity` | Trigger o insert desde el cliente |

**Qué desbloquea inmediatamente:**
- Solicitudes de **cualquier visitante** llegan a la bandeja (tiempo real con
  `supabase.channel` si se quiere el badge en vivo).
- Blog **visible para todo el mundo** (y para Google).
- Multi-dispositivo real: Nico en la Mac del estudio y en su teléfono.
- Respaldo automático (Postgres) — el botón de export queda como cortesía.

**Trabajo concreto**: reescribir ~8 funciones de `admin-store.ts`
(load/persist → queries), mover auth a Supabase Auth, subir portadas a
Storage. La UI no cambia.

---

## 2 · Fase 2 — Automatización con lo que YA tienes

Ari ya opera **n8n en el VPS de NeMo** y tiene **WhatsApp Cloud API aprobada**
(plantillas de NeMo Pulse). Eso convierte estas automatizaciones en ensamblaje,
no desarrollo:

| Automatización | Cómo | Esfuerzo |
|---|---|---|
| **Aviso de solicitud nueva** → WhatsApp a Nico | Supabase webhook (INSERT en `requests`) → n8n → Cloud API | ~1 h |
| **Recordatorio de sesión** (cliente, 24 h antes) | n8n cron diario → query `bookings` de mañana → plantilla WhatsApp | ~2 h |
| **Cobranza**: aviso de balance vencido | n8n cron lunes → `bookings` con `overdue` → WhatsApp/mail a Nico (o al cliente) | ~1 h |
| **Link de pago por depósito** | Mercado Pago / Stripe Payment Links pegado en la confirmación; fase 2.5: webhook de pago → marca `deposit` solo | ~½ h manual / ~3 h webhook |
| **Calendario personal**: reservas → Google Calendar | n8n (trigger en `bookings`) → Google Calendar node | ~1 h |
| **Resumen semanal** (facturación, ocupación, top clientes) por WhatsApp | n8n cron viernes → query → mensaje (mismo patrón que el weekly digest de Pulse) | ~1 h |

Regla: **cada automatización lee/escribe Supabase**; el CRM sigue siendo la
única pantalla. Nada de datos duplicados en hojas de cálculo.

---

## 3 · Qué NO construir (anti-scope)

- **Facturación CFDI** → Facturama / Bind (API mexicana); enlazar, no
  reimplementar.
- **Contabilidad** → export CSV mensual al contador (botón futuro de 1 h de
  trabajo), no módulo contable.
- **E-commerce de beats/merch** → si algún día aplica, Shopify Lite embebido.
- **App nativa** → el CRM ya es responsive con bottom-nav; un PWA manifest
  (icono en home screen) cuesta 1 h y cubre el 95 % del valor.

---

## 4 · Resumen ejecutivo

| Fase | Qué gana el negocio | Costo |
|---|---|---|
| **Hoy** (shipped) | Operación completa en un solo lugar, con marca propia | $0 |
| **1 · Supabase** | Solicitudes reales del sitio, blog público universal, multi-dispositivo | $0/mes (free tier) + 1–2 días |
| **2 · n8n + WhatsApp** | Recordatorios, cobranza y reportes sin tocar nada | infra ya pagada (VPS NeMo) + horas sueltas |
| **2.5 · Pagos** | Depósitos que se concilian solos | comisión del PSP |

El orden importa: **primero Supabase** (multiplica el valor de todo lo demás),
luego las automatizaciones de n8n una por una, empezando por el aviso de
solicitud nueva (la de mayor impacto comercial: responder rápido cierra
sesiones).
