import React from 'react';
import { motion } from 'motion/react';
import { useLang, content } from '../lib/i18n';
import { ease, dur } from '../lib/motion';
import { useSectionTheme, Label, Marquee } from '../components/primitives';

export function Catalogue() {
  const ref = useSectionTheme<HTMLElement>('smoke');
  const { lang } = useLang();
  const headline = content.catalogue.headline[lang];
  const items = content.catalogue.capabilities;

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ background: 'var(--color-smoke)', color: 'var(--color-pearl)' }}
    >
      <div className="container-x pt-[var(--gutter-y)] pb-12 md:pb-16">
        {/* Header */}
        <div className="grid grid-cols-12 gap-6 mb-14 md:mb-20">
          <div className="col-span-12 md:col-span-3">
            <Label>{content.catalogue.label[lang]}</Label>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-display-lg mb-8" style={{ letterSpacing: '-0.028em' }}>
              {headline.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: '110%' }}
                    whileInView={{ y: '0%' }}
                    viewport={{ once: true, margin: '-8%' }}
                    transition={{ duration: dur.lg, ease: ease.reveal, delay: i * 0.08 }}
                    style={{ willChange: 'transform' }}
                  >
                    {i === 0 ? line : <em className="italic-emphasis">{line}</em>}
                  </motion.span>
                </span>
              ))}
            </h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 0.9, y: 0 }}
              viewport={{ once: true, margin: '-8%' }}
              transition={{ duration: 1, ease: ease.outExpo, delay: 0.2 }}
              className="text-body-lg max-w-xl"
            >
              {content.catalogue.body[lang]}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Marquee row 1 · capabilities */}
      <div className="border-y border-current/30 py-10 md:py-14">
        <Marquee speed={70}>
          {items.map((r, i) => (
            <div key={`a${i}`} className="flex items-baseline gap-6 px-8 md:px-12 whitespace-nowrap">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ opacity: 0.82 }}>
                /{String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-4xl md:text-6xl" style={{ letterSpacing: '-0.02em' }}>
                {r.kind[lang]}
              </span>
              <span className="font-display italic-emphasis text-3xl md:text-5xl" style={{ letterSpacing: '-0.015em', opacity: 0.88 }}>
                {r.detail[lang]}
              </span>
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase" style={{ opacity: 0.8 }}>
                {r.tag[lang]}
              </span>
              <span className="text-3xl md:text-5xl px-4" style={{ opacity: 0.45 }}>·</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* Marquee row 2 · secondary cadence */}
      <div className="py-10 md:py-14 border-b border-current/30">
        <Marquee speed={90}>
          {[...items].reverse().map((r, i) => (
            <div key={`b${i}`} className="flex items-baseline gap-6 px-8 md:px-12 whitespace-nowrap" style={{ opacity: 0.85 }}>
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: 'var(--color-signal)' }}
                aria-hidden
              />
              <span className="font-display italic-emphasis text-2xl md:text-4xl" style={{ letterSpacing: '-0.015em' }}>
                {r.detail[lang]}
              </span>
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase">— {r.kind[lang]}</span>
              <span className="text-2xl md:text-4xl px-3" style={{ opacity: 0.4 }}>·</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* Footer of section */}
      <div className="container-x pt-12 md:pt-16 pb-[var(--gutter-y)]">
        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 md:col-span-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ opacity: 0.8 }}>
              {lang === 'es'
                ? 'Especialidades técnicas del estudio'
                : 'Technical specialties of the studio'}
            </p>
          </div>
          <div className="col-span-12 md:col-span-6 flex md:justify-end">
            <a
              href="#booking"
              data-cursor="hover"
              className="font-mono text-[11px] uppercase tracking-[0.18em] inline-flex items-center gap-3 border-b border-current/60 pb-1 hover:opacity-80 transition-opacity"
            >
              {lang === 'es' ? 'Tu próximo proyecto' : 'Your next project'}
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
                <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
