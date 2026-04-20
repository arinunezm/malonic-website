import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'es' | 'en';

type LangContext = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: <T extends Record<Lang, unknown>>(d: T) => T[Lang];
};

const Ctx = createContext<LangContext | null>(null);

const STORAGE_KEY = 'malonic.lang';

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'es' || stored === 'en') setLangState(stored);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const toggle = useCallback(() => {
    setLangState(prev => {
      const next = prev === 'es' ? 'en' : 'es';
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  const value = useMemo<LangContext>(() => ({
    lang,
    setLang,
    toggle,
    t: (d) => d[lang],
  }), [lang, setLang, toggle]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLang must be used within LangProvider');
  return c;
}

/* =========================================================================
   CONTENT DICTIONARY · all bilingual strings live here
   Todo el copy ancla en datos del diagnóstico SVC056 y el manual de marca
   2023. Cero contenido inventado (artistas, m², clientes sin verificar).
   ========================================================================= */

export const content = {
  brand: {
    name: 'malonic',
    sub: 'records',
  },

  nav: {
    items: [
      { id: 'studio', label: { es: 'Estudio', en: 'Studio' } },
      { id: 'equipment', label: { es: 'Equipo', en: 'Equipment' } },
      { id: 'services', label: { es: 'Servicios', en: 'Services' } },
      { id: 'booking', label: { es: 'Reservas', en: 'Booking' } },
    ] as const,
    live: { es: 'En sesión', en: 'In session' },
  },

  loader: {
    text: { es: 'Cargando estudio', en: 'Loading studio' },
  },

  hero: {
    eyebrow: 'DOLBY ATMOS 7.1.4 · CERTIFIED',
    location: { es: 'San Pedro Garza García, MX', en: 'San Pedro Garza García, MX' },
    headline: {
      es: ['Donde el sonido', 'encuentra su forma.'],
      en: ['Where sound', 'finds its form.'],
    },
    subhead: {
      es: 'Único estudio Dolby Atmos 7.1.4 certificado en el norte de México. Diseño acústico MDG por Horacio Malvicino.',
      en: 'The only Dolby Atmos 7.1.4 certified studio in northern Mexico. Acoustic design by MDG · Horacio Malvicino.',
    },
    ctaPrimary: { es: 'Agendar sesión', en: 'Book a session' },
    ctaSecondary: { es: 'Conoce el estudio', en: 'Discover the studio' },
    scroll: { es: 'Desliza', en: 'Scroll' },
  },

  manifesto: {
    label: { es: 'Manifiesto', en: 'Manifesto' },
    body: {
      es: ['Cada decisión sonora,', 'exactamente la que', 'escuchas.'],
      en: ['Every sonic decision,', 'exactly what you', 'hear.'],
    },
  },

  studio: {
    label: { es: '01 · El estudio', en: '01 · The studio' },
    headline: {
      es: ['Precisión', 'como idioma.'],
      en: ['Precision', 'as a language.'],
    },
    body: {
      es: 'Único estudio en el norte de México con certificación oficial Dolby Atmos 7.1.4. Cada superficie, ángulo y material fue calculado por Horacio Malvicino y MDG para que la sala desaparezca y solo quede la música.',
      en: 'The only officially Dolby Atmos 7.1.4 certified studio in northern Mexico. Every surface, angle, and material was calculated by Horacio Malvicino and MDG so the room disappears and only the music remains.',
    },
    pull: {
      es: '"La sala se vuelve transparente. La música se vuelve obvia."',
      en: '"The room becomes transparent. The music becomes obvious."',
    },
    stats: [
      { value: '7.1.4', label: { es: 'Canales certificados', en: 'Certified channels' } },
      { value: 'MDG', label: { es: 'Diseño acústico', en: 'Acoustic design' } },
      { value: '24/7', label: { es: 'Disponibilidad', en: 'Availability' } },
      { value: '01', label: { es: 'Único en el norte', en: 'Only one in the north' } },
    ],
  },

  equipment: {
    label: { es: '02 · Equipo', en: '02 · Equipment' },
    headline: {
      es: ['Construido', 'para la verdad.'],
      en: ['Built for', 'the truth.'],
    },
    body: {
      es: 'Cada pieza fue elegida porque dice exactamente lo que está pasando en la señal.',
      en: 'Every piece was chosen because it tells you exactly what is happening in the signal.',
    },
    rows: [
      { code: '01', name: 'Dolby Atmos', spec: '7.1.4 · Certified', detail: { es: 'Renderer + monitor controller', en: 'Renderer + monitor controller' } },
      { code: '02', name: 'Genelec', spec: 'Reference Monitoring', detail: { es: 'Sistema inmersivo de referencia', en: 'Immersive reference system' } },
      { code: '03', name: 'Ocean Way', spec: 'OWA 3.5 · Mains', detail: { es: 'Monitoreo principal de tres vías', en: 'Three-way main monitoring' } },
      { code: '04', name: 'MDG', spec: 'Acoustic Design', detail: { es: 'Horacio Malvicino · Buenos Aires', en: 'Horacio Malvicino · Buenos Aires' } },
      { code: '05', name: 'API · Neve · SSL', spec: 'Outboard', detail: { es: 'Pre, EQ y compresión analógica', en: 'Analog pre, EQ and compression' } },
      { code: '06', name: 'Pro Tools | HDX', spec: 'Workflow', detail: { es: 'Sesiones nativas Atmos', en: 'Native Atmos sessions' } },
    ],
  },

  services: {
    label: { es: '03 · Servicios', en: '03 · Services' },
    headline: {
      es: ['De la captura', 'al master.'],
      en: ['From capture', 'to master.'],
    },
    items: [
      {
        num: '01',
        name: { es: 'Grabación', en: 'Recording' },
        body: {
          es: 'Sesiones en sala diseñada por MDG. Cadenas de señal pristinas, tracking sin atajos.',
          en: 'Sessions in MDG-designed live room. Pristine signal chains, tracking without shortcuts.',
        },
        price: 'Desde MXN $7,000',
        unit: { es: 'paquete 6 horas', en: '6-hour package' },
      },
      {
        num: '02',
        name: { es: 'Mezcla Atmos', en: 'Atmos mix' },
        body: {
          es: 'Mezcla espacial certificada para Apple Music, Tidal y Amazon Music HD. Formato 7.1.4 nativo.',
          en: 'Certified spatial mix for Apple Music, Tidal and Amazon Music HD. Native 7.1.4 format.',
        },
        price: 'MXN $15,000 – $40,000',
        unit: { es: 'por track', en: 'per track' },
      },
      {
        num: '03',
        name: { es: 'Masterización', en: 'Mastering' },
        body: {
          es: 'Para streaming, vinilo y formatos espaciales. Cadena híbrida analógica y digital.',
          en: 'For streaming, vinyl, and immersive formats. Hybrid analog and digital chain.',
        },
        price: 'MXN $3,500 – $8,000',
        unit: { es: 'por track', en: 'per track' },
      },
      {
        num: '04',
        name: { es: 'Renta del estudio', en: 'Studio rental' },
        body: {
          es: 'Acceso completo para producciones e ingenieros invitados. Asistencia técnica disponible.',
          en: 'Full access for external productions and visiting engineers. Technical assistance available.',
        },
        price: 'MXN $8,000 – $18,000',
        unit: { es: 'por día', en: 'per day' },
      },
    ],
  },

  /* Reemplazamos "releases" (nombres inventados) por "capabilities" verificables.
     Mantiene el marquee estructural del diseño original, pero comunica
     especialidades reales del estudio en lugar de créditos ficticios. */
  catalogue: {
    label: { es: '04 · Capacidades', en: '04 · Capabilities' },
    headline: {
      es: ['Lo que construimos', 'aquí.'],
      en: ['What we build', 'here.'],
    },
    body: {
      es: 'Especialidades técnicas del estudio. Cada sesión se diseña alrededor de lo que el formato exige.',
      en: 'Technical specialties of the studio. Every session is designed around what the format demands.',
    },
    capabilities: [
      {
        kind: { es: 'Mezcla Atmos', en: 'Atmos Mix' },
        detail: { es: '7.1.4 espacial', en: '7.1.4 spatial' },
        tag: { es: 'Certificado', en: 'Certified' },
      },
      {
        kind: { es: 'Álbum completo', en: 'Full album' },
        detail: { es: 'Captura a master', en: 'Capture to master' },
        tag: { es: 'Turnkey', en: 'Turnkey' },
      },
      {
        kind: { es: 'Masterización', en: 'Mastering' },
        detail: { es: 'Streaming · Vinilo', en: 'Streaming · Vinyl' },
        tag: { es: 'Híbrido', en: 'Hybrid' },
      },
      {
        kind: { es: 'Sesión en vivo', en: 'Live session' },
        detail: { es: 'Sala acústica MDG', en: 'MDG-designed room' },
        tag: { es: 'Ensemble', en: 'Ensemble' },
      },
      {
        kind: { es: 'Re-mezcla espacial', en: 'Spatial re-mix' },
        detail: { es: 'Stereo → Atmos', en: 'Stereo → Atmos' },
        tag: { es: 'Upgrade', en: 'Upgrade' },
      },
      {
        kind: { es: 'Producción ejecutiva', en: 'Executive production' },
        detail: { es: 'Artistas invitados', en: 'Visiting artists' },
        tag: { es: 'Partner', en: 'Partner' },
      },
      {
        kind: { es: 'Tracking múltiple', en: 'Multi-track tracking' },
        detail: { es: 'Banda completa', en: 'Full band' },
        tag: { es: 'Analógico', en: 'Analog' },
      },
      {
        kind: { es: 'Ingeniería invitada', en: 'Visiting engineer' },
        detail: { es: 'Renta día completo', en: 'Full-day rental' },
        tag: { es: 'Open', en: 'Open' },
      },
    ],
  },

  booking: {
    label: { es: '05 · Reservas', en: '05 · Booking' },
    headline: {
      es: ['Empieza tu', 'sesión.'],
      en: ['Start your', 'session.'],
    },
    intro: {
      es: 'Cuéntanos sobre tu proyecto. Respondemos en menos de 24 horas con disponibilidad y un plan a medida.',
      en: 'Tell us about your project. We reply within 24 hours with availability and a tailored plan.',
    },
    fields: {
      name: { es: 'Nombre completo', en: 'Full name' },
      email: { es: 'Correo electrónico', en: 'Email address' },
      project: { es: 'Nombre del proyecto', en: 'Project name' },
      service: { es: 'Servicio', en: 'Service' },
      message: { es: 'Cuéntanos más', en: 'Tell us more' },
    },
    serviceOptions: {
      es: ['Grabación', 'Mezcla Atmos', 'Masterización', 'Renta del estudio', 'Otro'],
      en: ['Recording', 'Atmos mix', 'Mastering', 'Studio rental', 'Other'],
    },
    submit: { es: 'Enviar solicitud', en: 'Submit inquiry' },
    contact: {
      label: { es: 'O escríbenos directo', en: 'Or write to us directly' },
      email: 'info@malonicrecords.com',
      phone: '+52 81 2394 5506',
    },
  },

  footer: {
    tagline: {
      es: 'Sonido espacial, sin concesiones.',
      en: 'Spatial sound, uncompromised.',
    },
    sections: [
      {
        title: { es: 'Estudio', en: 'Studio' },
        items: [
          { es: 'Ave. Gómez Morín 922', en: 'Ave. Gómez Morín 922' },
          { es: 'Local 6 · Col. Carrizalejo', en: 'Local 6 · Carrizalejo' },
          { es: 'San Pedro Garza García, NL', en: 'San Pedro Garza García, NL' },
        ],
      },
      {
        title: { es: 'Contacto', en: 'Contact' },
        items: [
          { es: 'info@malonicrecords.com', en: 'info@malonicrecords.com' },
          { es: '+52 81 2394 5506', en: '+52 81 2394 5506' },
          { es: 'Agenda por reserva', en: 'By appointment' },
        ],
      },
      {
        title: { es: 'Síguenos', en: 'Follow' },
        items: [
          { es: 'Instagram', en: 'Instagram' },
          { es: 'Spotify', en: 'Spotify' },
          { es: 'Apple Music', en: 'Apple Music' },
        ],
      },
    ],
    rights: {
      es: '© 2026 Malonic Records · Todos los derechos reservados',
      en: '© 2026 Malonic Records · All rights reserved',
    },
    dolby: {
      es: 'Dolby Atmos es marca registrada de Dolby Laboratories.',
      en: 'Dolby Atmos is a registered trademark of Dolby Laboratories.',
    },
    credits: {
      es: 'Diseño & código por NeMo — Monterrey',
      en: 'Design & code by NeMo — Monterrey',
    },
  },
};
