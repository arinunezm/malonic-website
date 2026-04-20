# Malonic Records — Website

Sitio web de **Malonic Records** — único estudio Dolby Atmos 7.1.4 certificado del norte de México.
San Pedro Garza García, NL · Diseño acústico MDG por Horacio Malvicino.

**Stack:** React 19 · Vite 6 · Tailwind v4 · Motion (framer) · TypeScript · Vanilla CSS tokens.

Single-page experience, 8 secciones, bilingüe ES/EN, custom cursor, smooth reveal animations, dark/paper theme transitions on scroll.

---

## Desarrollo local

```bash
# Requiere Node ≥ 20
npm install
npm run dev        # → http://localhost:3000
```

Otros scripts:

```bash
npm run build      # producción → dist/
npm run preview    # preview del build → http://localhost:4173
npm run typecheck  # tsc --noEmit
npm run clean      # borra dist/
```

---

## Estructura

```
malonic-website/
├── index.html            ← meta tags SEO, JSON-LD LocalBusiness, preloads
├── vite.config.ts        ← build config con manualChunks (motion / react)
├── vercel.json           ← framework vite, headers seguridad + cache immutable
├── public/
│   ├── favicon.svg       ← 32×32 con dot verde Pantone 802C
│   ├── og-image.jpg      ← 1400px para OpenGraph
│   ├── robots.txt
│   ├── sitemap.xml
│   └── img/              ← 6 fotos reales del estudio (~0.5–0.9 MB cada una)
└── src/
    ├── main.tsx
    ├── App.tsx           ← composición de secciones + loading screen
    ├── index.css         ← design tokens (@theme) + Tailwind v4
    ├── lib/
    │   ├── i18n.tsx      ← diccionario bilingüe completo (ES/EN)
    │   └── motion.ts     ← tokens de easing y duración
    ├── components/
    │   ├── Nav.tsx       ← sticky nav con ES/EN toggle, live dot
    │   └── primitives.tsx← Cursor, Grain, LoadingScreen, RevealImage/Text, MagneticButton, Marquee, useSectionTheme
    └── sections/
        ├── Hero.tsx          ← full-viewport + parallax
        ├── Manifesto.tsx     ← paper theme
        ├── Studio.tsx        ← galería editorial asimétrica + stats
        ├── Equipment.tsx     ← spec-sheet + sticky image card
        ├── Services.tsx      ← 4 cards con hover sweep
        ├── Catalogue.tsx     ← marquee de capacidades (no artistas fake)
        ├── Booking.tsx       ← form concierge + contact column
        └── Footer.tsx        ← wordmark gigante + columnas
```

---

## Brand tokens (manual 2023)

- **Verde Malonic:** `#00C629` (Pantone 802C) — solo acento técnico, nunca protagonista.
- **Negro:** `#0A0A0A` (casi-negro, no puro).
- **Off-white cálido:** `#F5F3EE` (secciones claras).
- **Tipografía:** Fraunces (display) · Inter (body) · JetBrains Mono (labels técnicos).

El manual oficial define solo **3 colores** (Pantone 802C + blanco + negro). Los grises cálidos (`bone`, `mist`, `pearl`, `smoke`) son extensiones editoriales para layout; cualquier comunicación oficial debe ceñirse a la paleta de 3.

---

## Datos de contacto (reales · diagnóstico SVC056)

- **Email:** info@malonicrecords.com
- **Teléfono:** +52 81 2394 5506
- **Fundador (Nicolás Mateo):** +52 81 1062 3853 · nicolas.mateo@malonicrecords.com
- **Dirección:** Ave. Gómez Morín 922, Local 6, Col. Carrizalejo, San Pedro Garza García, NL.

---

## Deploy a Vercel

### 1 · Crear repo en GitHub

```bash
cd /Users/arinunez/Desktop/NeMo-Projects/clientes/malonic-website
git init
git add .
git commit -m "feat: initial Malonic Records website v1"

# Crear repo en GitHub (desde UI o gh cli)
gh repo create malonic-website --public --source=. --remote=origin
git push -u origin main
```

### 2 · Conectar a Vercel

Opción A — **UI:** https://vercel.com/new → importar el repo `malonic-website` → Vercel detecta framework Vite automáticamente (hay `vercel.json`) → Deploy.

Opción B — **CLI:**

```bash
npm i -g vercel
vercel --yes           # primer deploy staging
vercel --prod          # deploy a producción
```

### 3 · Configurar dominio custom

Dashboard Vercel → Project → Settings → Domains → agregar `malonicrecords.com` y `www.malonicrecords.com`. Seguir las instrucciones de DNS (A record `76.76.21.21` o CNAME `cname.vercel-dns.com`).

### 4 · Variables de entorno

Ninguna requerida — el sitio es 100% estático. Form de booking actualmente hace submit en local state; para wiring real: integrar Resend / Formspree / Vercel Edge Functions.

---

## Pendientes (roadmap)

- **Form booking real:** hoy muestra confirmación en memoria. Conectar a Resend/Formspree para enviar a `info@malonicrecords.com`.
- **Apple touch icon:** generar PNGs 180×180 + 192×192 + 512×512 para PWA.
- **Og-image refinada:** la actual es el hero recortado; idealmente componer con wordmark + tagline.
- **Fotos adicionales:** hay ~15 fotos más en `clientes/malonic/` si se quiere expandir galería.
- **Portafolio real:** `Catalogue` muestra **capacidades** en lugar de nombres inventados. Cuando Nicolás autorice mencionar artistas reales, reemplazar `content.catalogue.capabilities` en `src/lib/i18n.tsx`.
- **CRM:** del diagnóstico SVC056 → conectar booking a Notion/Hubspot para tracking.

---

## Notas del diagnóstico SVC056

El sitio encarna el reposicionamiento propuesto:

1. **"El especialista Dolby Atmos del norte"** — mensaje central del hero, no freelance genérico.
2. **Repricing premium:** servicios listados con rangos del benchmark ($15K–40K/track Atmos).
3. **Honestidad editorial:** sin artistas inventados, sin m² inverificables.
4. **Canal activo:** form de booking, no tarjeta de presentación estática.

Detalle completo: `1. Clientes/malonic/Malonic_SVC056_Reporte_v1.docx`.

---

*Diseño & desarrollo por NeMo — Monterrey · Abril 2026*
