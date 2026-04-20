import React from 'react';
import { motion } from 'motion/react';
import { useLang, content } from '../lib/i18n';
import { ease, dur } from '../lib/motion';
import { useSectionTheme, Label } from '../components/primitives';

export function Services() {
  const ref = useSectionTheme<HTMLElement>('paper');
  const { lang } = useLang();
  const headline = content.services.headline[lang];

  return (
    <section
      id="services"
      ref={ref}
      className="relative w-full"
      style={{ background: 'var(--color-bone)', color: 'var(--color-ink)' }}
    >
      <div className="container-x section-y">
        {/* Header */}
        <div className="grid grid-cols-12 gap-6 mb-14 md:mb-20">
          <div className="col-span-12 md:col-span-3">
            <Label>{content.services.label[lang]}</Label>
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

        {/* 4-card editorial grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-current/20">
          {content.services.items.map((item, i) => {
            const border =
              i === 0 ? 'md:border-r md:border-b' :
              i === 1 ? 'md:border-b' :
              i === 2 ? 'md:border-r' :
              '';

            return (
              <motion.article
                key={item.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-8%' }}
                transition={{ duration: 0.9, ease: ease.outExpo, delay: (i % 2) * 0.08 }}
                className={`group relative border-b border-current/20 ${border} px-2 md:px-10 py-12 md:py-16`}
                data-cursor="hover"
              >
                {/* Hover sweep */}
                <motion.div
                  aria-hidden
                  className="absolute inset-0 origin-bottom"
                  style={{ background: 'var(--color-ink)', zIndex: 0 }}
                  initial={{ scaleY: 0 }}
                  whileHover={{ scaleY: 1 }}
                  transition={{ duration: 0.6, ease: ease.outExpo }}
                />
                <div className="relative z-10 flex flex-col h-full min-h-[260px] transition-colors duration-500 group-hover:text-[color:var(--color-paper)]">
                  <div className="flex items-start justify-between mb-8">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-80">
                      / {item.num}
                    </span>
                    <Arrow />
                  </div>

                  <h3 className="font-display text-3xl md:text-4xl mb-5" style={{ letterSpacing: '-0.02em' }}>
                    {item.name[lang]}
                  </h3>

                  <p className="max-w-md text-[15px] mb-10" style={{ opacity: 0.88 }}>
                    {item.body[lang]}
                  </p>

                  <div className="mt-auto pt-6 border-t border-current/30 flex items-end justify-between gap-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-80">
                      {lang === 'es' ? 'Cotización privada' : 'Private quote'}
                    </div>
                    <a
                      href="#booking"
                      className="font-mono text-[11px] uppercase tracking-[0.18em] underline underline-offset-4 opacity-90 group-hover:opacity-100 transition-opacity"
                    >
                      {lang === 'es' ? 'Solicitar →' : 'Inquire →'}
                    </a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg
      width="22"
      height="14"
      viewBox="0 0 22 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="opacity-75 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-2"
    >
      <path d="M1 7H21M21 7L15 1M21 7L15 13" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
    </svg>
  );
}
