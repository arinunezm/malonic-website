import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useLang, content } from '../lib/i18n';
import { ease, dur } from '../lib/motion';
import { useSectionTheme, Label } from '../components/primitives';

export function Manifesto() {
  const ref = useSectionTheme<HTMLElement>('paper');
  const { lang } = useLang();
  const lines = content.manifesto.body[lang];
  const reduce = useReducedMotion();

  // Split each line into words + keep spaces inside individual spans.
  // Word-by-word cascade reads less uniform than line-by-line = more human.
  const wordMatrix = useMemo(() =>
    lines.map((line) => line.split(' ')),
  [lines]);

  return (
    <section
      ref={ref}
      className="relative w-full"
      style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}
    >
      <div className="container-x section-y">
        <div className="grid grid-cols-12 gap-6 mb-12 md:mb-16">
          <div className="col-span-12 md:col-span-3">
            <Label>{content.manifesto.label[lang]}</Label>
          </div>
          <motion.div
            className="hidden md:block md:col-span-9"
            initial={{ scaleX: 0, transformOrigin: '0% 50%' }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-8%' }}
            transition={{ duration: 1.2, ease: ease.outExpo }}
          >
            <div className="h-px w-full bg-current opacity-30 mt-3" />
          </motion.div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-10 md:col-start-2">
            <h2 className="font-display text-display-lg" style={{ letterSpacing: '-0.03em', lineHeight: 0.95 }}>
              <motion.span
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                style={{ display: 'block' }}
              >
                {wordMatrix.map((words, li) => (
                  <span key={li} className="block" style={{ paddingBottom: '0.15em' }}>
                    {words.map((word, wi) => {
                      const isLast = li === 1;
                      const baseDelay = reduce ? 0 : li * 0.12 + wi * 0.045;
                      return (
                        <span
                          key={`${li}-${wi}`}
                          className="inline-block align-baseline"
                          style={{
                            marginRight: '0.26em',
                            /* clip-path lets us mask only the top edge, so descenders
                               (q, g, y, p) and the cedilla on ç aren't chopped. */
                            clipPath: 'inset(0 -5% -30% -5%)',
                            WebkitClipPath: 'inset(0 -5% -30% -5%)',
                          }}
                        >
                          <motion.span
                            className="inline-block"
                            variants={{
                              hidden: { y: '105%', opacity: 0 },
                              visible: {
                                y: '0%',
                                opacity: 1,
                                transition: {
                                  duration: reduce ? 0.001 : 1.2,
                                  ease: ease.reveal,
                                  delay: baseDelay,
                                },
                              },
                            }}
                            style={{ willChange: 'transform' }}
                          >
                            {isLast ? <em className="italic-emphasis">{word}</em> : word}
                          </motion.span>
                        </span>
                      );
                    })}
                  </span>
                ))}
              </motion.span>
            </h2>
          </div>
        </div>

        {/* Closing mark · pulsing dot instead of AI-sounding tagline */}
        <div className="grid grid-cols-12 gap-6 mt-14 md:mt-20">
          <div className="col-span-12 md:col-span-6 md:col-start-7 flex items-center gap-4">
            <motion.span
              className="block h-px flex-1"
              style={{ background: 'currentColor', opacity: 0.3 }}
              initial={{ scaleX: 0, transformOrigin: '0% 50%' }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-8%' }}
              transition={{ duration: 1.4, ease: ease.outExpo, delay: 0.2 }}
            />
            <motion.span
              className="live-dot"
              aria-hidden
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-8%' }}
              transition={{ duration: 0.6, ease: ease.outExpo, delay: 0.5 }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
