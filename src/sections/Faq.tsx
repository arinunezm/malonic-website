import React from 'react';
import { motion } from 'motion/react';
import { useLang, content } from '../lib/i18n';
import { ease, dur } from '../lib/motion';
import { useSectionTheme, Label } from '../components/primitives';

/**
 * FAQ — bloque editorial de objeciones, justo antes de Reservas.
 * Mismo lenguaje visual que Services (tema paper, hairlines, reveal en scroll).
 */
export function Faq() {
  const ref = useSectionTheme<HTMLElement>('paper');
  const { lang } = useLang();
  const headline = content.faq.headline[lang];

  return (
    <section
      id="faq"
      ref={ref}
      className="relative w-full"
      style={{ background: 'var(--color-bone)', color: 'var(--color-ink)' }}
    >
      <div className="container-x section-y">
        {/* Header */}
        <div className="grid grid-cols-12 gap-6 mb-14 md:mb-20">
          <div className="col-span-12 md:col-span-3">
            <Label>{content.faq.label[lang]}</Label>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-display-lg" style={{ letterSpacing: '-0.028em' }}>
              {headline.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: '110%' }}
                    whileInView={{ y: '0%' }}
                    viewport={{ once: true, margin: '-12%' }}
                    transition={{ duration: dur.lg, ease: ease.reveal, delay: i * 0.08 }}
                    style={{ willChange: 'transform' }}
                  >
                    {i === 1 ? <em className="italic-emphasis">{line}</em> : line}
                  </motion.span>
                </span>
              ))}
            </h2>
          </div>
        </div>

        {/* Q&A list */}
        <div className="border-t border-current/20">
          {content.faq.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-8%' }}
              transition={{ duration: 0.8, ease: ease.outExpo, delay: (i % 2) * 0.05 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 border-b border-current/20 py-8 md:py-10"
            >
              <h3
                className="md:col-span-5 font-display text-2xl md:text-[28px]"
                style={{ letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                {item.q[lang]}
              </h3>
              <p
                className="md:col-span-7 text-[15px] md:text-base max-w-2xl"
                style={{ opacity: 0.82, lineHeight: 1.6 }}
              >
                {item.a[lang]}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Tail CTA */}
        <div className="mt-12 md:mt-16">
          <a
            href="#booking"
            data-cursor="hover"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] underline underline-offset-4 hover:opacity-70 transition-opacity"
          >
            {lang === 'es' ? '¿Otra pregunta? Escríbenos' : 'Another question? Get in touch'} →
          </a>
        </div>
      </div>
    </section>
  );
}
