import React from 'react';
import { motion } from 'motion/react';
import { useLang, content } from '../lib/i18n';
import { ease, dur } from '../lib/motion';
import { useSectionTheme, Label } from '../components/primitives';

export function Footer() {
  const ref = useSectionTheme<HTMLElement>('dark');
  const { lang } = useLang();

  return (
    <footer
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <div className="container-x pt-[var(--gutter-y)] pb-12">
        {/* Tagline + columns */}
        <div className="grid grid-cols-12 gap-6 mb-24 md:mb-32">
          <div className="col-span-12 md:col-span-5 mb-12 md:mb-0">
            <Label className="opacity-70 mb-6">/ {lang === 'es' ? 'Estudio' : 'Studio'}</Label>
            <h3 className="font-display text-display-md max-w-md mt-6" style={{ letterSpacing: '-0.025em', lineHeight: 0.95 }}>
              {content.footer.tagline[lang]}
            </h3>
          </div>

          <div className="col-span-12 md:col-span-7 grid grid-cols-3 gap-6">
            {content.footer.sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.8, ease: ease.outExpo, delay: i * 0.06 }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-50 mb-5">
                  {section.title[lang]}
                </p>
                <ul className="space-y-2 text-sm opacity-80">
                  {section.items.map((it, j) => (
                    <li key={j} className="hover:opacity-60 transition-opacity">
                      {it[lang]}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Oversized logo mark as texture · edge-to-edge */}
      <motion.div
        className="relative -mb-[1vw] select-none overflow-hidden flex justify-center items-end px-2"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-5%' }}
        transition={{ duration: dur.lg, ease: ease.outExpo }}
        aria-hidden
      >
        <motion.img
          src="/img/logo-dark.png"
          alt=""
          className="pointer-events-none block"
          style={{
            width: 'min(96vw, 1800px)',
            height: 'auto',
          }}
          initial={{ scale: 0.985 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 2.2, ease: 'easeOut' }}
          draggable={false}
        />
      </motion.div>

      {/* Bottom bar */}
      <div className="container-x pt-12 pb-10 border-t border-current/15">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 font-mono text-[10px] uppercase tracking-[0.18em] opacity-60">
          <p>{content.footer.rights[lang]}</p>
          <p className="md:max-w-md">{content.footer.dolby[lang]}</p>
          <p>{content.footer.credits[lang]}</p>
        </div>
      </div>
    </footer>
  );
}
