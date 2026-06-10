# Auditoría del CRM Malonic — 9/10 junio 2026 (sesión nocturna)

Auditoría completa del admin (`/admin`) tras el rebuild low-code: funcionalidad,
seguridad, capa de datos y UX. Todo lo marcado **[CORREGIDO]** se arregló y
deployó en esta misma sesión; lo marcado **[FASE 2]** o **[MEJORA]** queda
documentado para decidirse después.

---

## 1 · QA funcional (E2E en navegador, viewport desktop + 375px)

| Flujo | Resultado |
|---|---|
| Setup inicial (crear cuenta admin) → shell | ✅ |
| Login correcto / contraseña incorrecta (error + shake) | ✅ |
| Refresh con sesión viva no expulsa; logout sí | ✅ |
| Catálogo base (5 servicios reales del sitio) | ✅ |
| Editar tarifa de servicio → persiste y refleja en UI | ✅ |
| Crear reserva (cliente nuevo + auto-alta en directorio) | ✅ |
| Editar reserva (prefill correcto, recálculo) | ✅ |
| Acciones de fila: confirmar / completar / marcar pagada / eliminar (con confirmación) | ✅ |
| Calendario: semana actual real, navegación ←/hoy/→, click en bloque = editar | ✅ |
| Form público de reservas → bandeja Solicitudes (badge, dashboard inbox) | ✅ |
| Convertir solicitud → modal prefill (servicio auto-detectado) → request `converted` | ✅ |
| Blog: crear, **subir portada** (resize 1800px→1400px JPEG ~13 KB), publicar, despublicar, borrador | ✅ |
| `/blog` y `/blog/:slug` públicos renderizan lo publicado; 404 de slug inexistente | ✅ |
| Usuarios: alta staff, reset contraseña, guarda "último admin", sin auto-borrado | ✅ |
| Datos: medidor de almacenamiento, import inválido rechazado con error legible, borrar-todo → setup | ✅ |
| Búsqueda con contador "n de m" + estados vacíos con CTA en todas las páginas | ✅ |
| Analítica: 6 gráficos calculados de data real (verificada la aritmética de cobranza) | ✅ |
| Sitio marketing intacto (7 secciones) | ✅ |

### Bug crítico encontrado y corregido
**AnimatePresence (motion v12.23 + React 19) nunca completaba los exits** bajo
re-renders del provider: dejaba overlays a `opacity: 0` vivos en el DOM
(backdrop del modal bloqueando clicks, páginas que no cambiaban, el shell que
nunca montaba tras login). **[CORREGIDO]** — todo el admin usa renders
condicionales con animación de entrada; no reintroducir `AnimatePresence
mode="wait"` para swaps de árboles completos en el admin.

---

## 2 · Seguridad

### Modelo de amenaza (honesto)
El CRM es **local-first sin backend**: toda la data (incluidos hashes de
contraseñas) vive en `localStorage` del navegador del operador. El login es un
**control de acceso para el equipo del estudio**, no una frontera de seguridad:
cualquier persona con acceso físico/devtools al navegador puede leer la data.
La frontera real llega con la fase backend.

### Lo corregido esta noche
- **[CORREGIDO] PBKDF2-SHA256 con 100,000 iteraciones** reemplaza al SHA-256
  simple para hashear contraseñas (resistencia real a fuerza bruta offline
  sobre un respaldo robado). Salt criptográfico de 16 bytes
  (`crypto.getRandomValues`) en vez de derivado de UUID.
- **[CORREGIDO] Migración transparente**: cuentas legacy (sha256) siguen
  entrando y se re-hashean a PBKDF2 automáticamente en su siguiente login.

### Revisión de superficies
- **XSS**: sin `dangerouslySetInnerHTML` en todo el código (verificado por
  grep). Todo string capturado por el usuario se renderiza como texto React
  (escapado). Portadas = data-URLs JPEG generadas por canvas propio (inertes).
- **Headers** (vercel.json): `nosniff`, `X-Frame-Options: SAMEORIGIN`,
  `Referrer-Policy` ✅.
- **Respaldo JSON** contiene hashes (no contraseñas planas) — tratarlo como
  archivo sensible de todos modos.
- **npm audit**: 0 vulnerabilidades.

### Pendientes documentados
- **[MEJORA] CSP** (`Content-Security-Policy`): recomendada
  `default-src 'self'; img-src 'self' data: blob:; style-src 'self'
  'unsafe-inline'; script-src 'self'` — no se shippeó esta noche para no
  arriesgar prod sin re-test completo de fuentes/estilos.
- **[MEJORA] Throttle de intentos de login** (client-side, cosmético hasta
  tener backend).
- **[FASE 2] Auth real del lado servidor** (Supabase Auth) — ver
  `OPERACION_LOW_CODE.md`.

---

## 3 · Capa de datos (el "backend" local)

**Diseño**: documento único versionado (`malonic-admin-store-v1`) en
localStorage; todas las lecturas/escrituras pasan por `src/lib/admin-store.ts`
(un solo archivo a swapear cuando exista API).

| Aspecto | Estado |
|---|---|
| Versionado + normalización defensiva al cargar (`normalizeStore`) | ✅ |
| Quota llena → la escritura falla con toast de advertencia (no crash) | ✅ |
| Multi-pestaña: `storage` event re-hidrata el admin cuando el sitio público escribe | ✅ |
| IDs: `crypto.randomUUID` con fallback | ✅ |
| Import: valida versión/shape, error legible, no toca data si falla | ✅ |
| Imágenes: resize a 1400px JPEG q0.82 (~13 KB la portada de prueba) | ✅ |
| Medidor de uso vs presupuesto ~5 MB + aviso a >80% | ✅ |

**Límites conocidos**:
- Capacidad práctica: cientos de reservas/clientes + ~20–40 posts con portada
  dentro de los ~5 MB de localStorage. Suficiente para operar meses; el
  respaldo JSON es la red de seguridad.
- Dos pestañas del admin escribiendo a la vez = last-write-wins (mitigado por
  la re-hidratación cross-tab; ventana de carrera pequeña, aceptable para un
  solo operador).
- **La data vive en UN navegador**: cambiar de equipo = exportar/importar
  respaldo. (Resuelto de raíz en fase 2.)

---

## 4 · Diseño / experiencia

### Corregido esta noche
- **[CORREGIDO] Táctil**: las acciones de fila (editar/pagar/eliminar en
  reservas, clientes y servicios) eran hover-only — invisibles en touch. Ahora
  siempre visibles en `<md`, hover-reveal solo en desktop.
- **[CORREGIDO] Búsqueda en móvil**: el campo del topbar estaba oculto en
  `<sm`; ahora hay barra de búsqueda móvil bajo el topbar en las páginas
  buscables (panel, reservas, clientes, solicitudes).
- **[CORREGIDO] autoFocus** en el primer campo de todos los modales de captura.
- **[CORREGIDO]** Logout resetea a dashboard y limpia búsqueda (no heredar
  estado entre sesiones de usuarios distintos).

### Fortalezas (mantener)
Identidad visual 1:1 con el sitio (ink/paper/signal, Fraunces + JetBrains
Mono); estados vacíos con CTA que guían el primer uso ("Cargar catálogo
base", "Primera reserva"); feedback inmediato (toasts, badges vivos); la
access card 3D como momento de marca.

### Mejoras documentadas (no urgentes)
- **[MEJORA]** `prefers-reduced-motion` para las animaciones de entrada.
- **[MEJORA]** Contraste de `--color-mist` sobre ink en textos largos (AA
  borderline en labels pequeños; consistente con el sitio, revisar si Nico
  reporta fatiga).
- **[MEJORA]** Vista "agenda del día" (lista, no grid) para móvil en
  calendario.
- **[MEJORA]** Undo en eliminaciones (toast con "deshacer" 5 s) en vez de solo
  confirmación previa.

---

## 5 · Veredicto

El CRM está **listo para que Nico opere hoy** dentro del alcance local-first:
captura, agenda, cobranza, blog y analítica funcionan de punta a punta,
verificados en navegador real (desktop + móvil). Los dos riesgos estructurales
(data en un solo navegador; solicitudes/blog limitados al mismo navegador)
son inherentes a la falta de backend y están señalizados dentro del producto
("Fase 2 · Backend" en Datos & respaldo). Plan concreto en
`OPERACION_LOW_CODE.md`.
