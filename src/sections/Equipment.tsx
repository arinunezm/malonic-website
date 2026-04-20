import React from 'react';
import { motion } from 'motion/react';
import { useLang, content } from '../lib/i18n';
import { ease, dur } from '../lib/motion';
import { useSectionTheme, Label, RevealImage } from '../components/primitives';

const EQ_IMG = '/img/equipment-rack.jpg';

export function Equipment() {
  const ref = useSectionTheme<HTMLElement>('paper');
  const { lang } = useLang();
  const headline = content.equipment.headline[lang];

  return (
    <section
      id="equipment"
      ref={ref}
      className="relative w-full"
      style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}
    >
      <div className="container-x section-y">
        {/* Header */}
        <div className="grid grid-cols-12 gap-6 mb-14 md:mb-20">
          <div className="col-span-12 md:col-span-3">
            <Label>{content.equipment.label[lang]}</Label>
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
              whileInView={{ opacity: 0.88, y: 0 }}
              viewport={{ once: true, margin: '-8%' }}
              transition={{ duration: 1, ease: ease.outExpo, delay: 0.2 }}
              className="text-body-lg max-w-xl"
            >
              {content.equipment.body[lang]}
            </motion.p>
          </div>
        </div>

        {/* Certifications · placed above the spec sheet for visibility */}
        <Certifications lang={lang} />

        {/* Spec sheet · grid table */}
        <div className="grid grid-cols-12 gap-6 lg:gap-12">
          <div className="col-span-12 lg:col-span-7">
            <div className="border-t border-current/20">
              {content.equipment.rows.map((row, i) => (
                <motion.div
                  key={row.code}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.8, ease: ease.outExpo, delay: i * 0.05 }}
                  className="relative group grid grid-cols-12 gap-4 py-7 md:py-8 border-b border-current/30 items-baseline overflow-hidden cursor-default"
                >
                  {/* Horizontal sweep line on hover */}
                  <motion.span
                    aria-hidden
                    className="absolute left-0 top-0 h-full w-[2px]"
                    style={{ background: 'var(--color-signal)', transformOrigin: '50% 0%' }}
                    initial={{ scaleY: 0 }}
                    whileHover={{ scaleY: 1 }}
                    transition={{ duration: 0.5, ease: ease.outExpo }}
                  />
                  {/* Background wash on hover */}
                  <motion.span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: 'currentColor', opacity: 0 }}
                    variants={{
                      rest: { opacity: 0, x: '-3%' },
                      hover: { opacity: 0.05, x: '0%' },
                    }}
                    initial="rest"
                    whileHover="hover"
                    transition={{ duration: 0.45, ease: ease.outExpo }}
                  />
                  <span className="relative z-10 col-span-2 md:col-span-1 font-mono text-[11px] tracking-[0.18em] opacity-75">
                    {row.code}
                  </span>
                  <span className="relative z-10 col-span-10 md:col-span-4 font-display text-2xl md:text-3xl transition-transform duration-500 group-hover:translate-x-2" style={{ letterSpacing: '-0.018em' }}>
                    {row.name}
                  </span>
                  <span className="relative z-10 col-span-12 md:col-span-3 font-mono text-[11px] uppercase tracking-[0.18em] md:text-right md:pr-4" style={{ opacity: 0.85 }}>
                    {row.spec}
                  </span>
                  <span className="relative z-10 col-span-12 md:col-span-4 text-sm md:text-right" style={{ opacity: 0.82 }}>
                    {row.detail[lang]}
                  </span>
                </motion.div>
              ))}
            </div>

          </div>

          {/* Sticky-feeling image card */}
          <div className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <RevealImage
                src={EQ_IMG}
                alt="Outboard rack &amp; Genelec monitors"
                ratio="3/4"
                cover="paper"
              />
              <div className="mt-6 flex items-start justify-between gap-6 pt-6 border-t border-current/30">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] mb-2" style={{ opacity: 0.8 }}>
                    Fig. 04
                  </p>
                  <p className="font-display text-xl" style={{ letterSpacing: '-0.015em' }}>
                    Outboard &amp; <em className="italic-emphasis">monitors</em>
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] pt-1 inline-flex items-center gap-2" style={{ opacity: 0.8 }}>
                  <span className="live-dot" />
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   CERTIFICATIONS STRIP · Dolby Atmos + Genelec partner logos
   Usa colores naturales de cada marca (Dolby negro · Genelec teal).
   ========================================================================= */
function Certifications({ lang }: { lang: 'es' | 'en' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 1, ease: ease.outExpo, delay: 0.05 }}
      className="mb-12 md:mb-16 pt-8 pb-10 md:pb-12 border-t border-b border-current/30"
    >
      <div className="grid grid-cols-12 gap-6 items-center">
        <div className="col-span-12 md:col-span-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ opacity: 0.8 }}>
            {lang === 'es' ? 'Certificaciones' : 'Certifications'}
          </p>
        </div>
        <div className="col-span-12 md:col-span-9 flex items-center gap-10 md:gap-16 flex-wrap">
          <motion.img
            src="/img/logo-dolby-atmos.png"
            alt="Dolby Atmos"
            className="h-11 md:h-14 w-auto"
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: ease.outExpo, delay: 0.15 }}
            whileHover={{ scale: 1.03 }}
            style={{ willChange: 'transform' }}
          />
          <motion.span
            aria-hidden
            className="hidden md:block h-10 w-px bg-current opacity-20"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: ease.outExpo, delay: 0.35 }}
          />
          <motion.img
            src="/img/logo-genelec.png"
            alt="Genelec"
            className="h-8 md:h-10 w-auto"
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: ease.outExpo, delay: 0.3 }}
            whileHover={{ scale: 1.03 }}
            style={{ willChange: 'transform' }}
          />
          <motion.span
            className="font-mono text-[10px] uppercase tracking-[0.22em] md:ml-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.8 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.55 }}
          >
            MDG · Ocean Way · API · Neve · SSL
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
