import React from 'react';
import { motion } from 'motion/react';
import { useLang, content } from '../lib/i18n';
import { ease, dur } from '../lib/motion';
import { useSectionTheme, Label, RevealImage } from '../components/primitives';

const IMG_LARGE = '/img/studio-liveroom.jpg';
const IMG_SMALL_1 = '/img/studio-drums-wide.jpg';
const IMG_SMALL_2 = '/img/studio-drums-close.jpg';
const IMG_WIDE = '/img/studio-controlroom-purple.jpg';

export function Studio() {
  const ref = useSectionTheme<HTMLElement>('dark');
  const { lang } = useLang();
  const headline = content.studio.headline[lang];

  return (
    <section
      id="studio"
      ref={ref}
      className="relative w-full"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <div className="container-x section-y">
        {/* Section header */}
        <div className="grid grid-cols-12 gap-6 mb-12 md:mb-20">
          <div className="col-span-12 md:col-span-3">
            <Label>{content.studio.label[lang]}</Label>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-display-lg" style={{ letterSpacing: '-0.028em' }}>
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
                    {i === 1 ? <em className="italic-emphasis">{line}</em> : line}
                  </motion.span>
                </span>
              ))}
            </h2>
          </div>
        </div>

        {/* Asymmetric editorial pair */}
        <div className="grid grid-cols-12 gap-6 mb-16 md:mb-24">
          <div className="col-span-12 md:col-span-7">
            <RevealImage
              src={IMG_LARGE}
              alt="Malonic Records · live room"
              ratio="4/5"
              cover="ink"
            />
            <div className="flex items-center justify-between mt-4 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ opacity: 0.75 }}>
              <span>Fig. 01 · {lang === 'es' ? 'Sala en vivo' : 'Live room'}</span>
              <span>{content.studio.label[lang].replace('01 · ', '')}</span>
            </div>
          </div>

          <div className="col-span-12 md:col-span-5 flex flex-col gap-6">
            <div className="md:mt-12 lg:mt-20">
              <RevealImage
                src={IMG_SMALL_1}
                alt="Yamaha drum kit"
                ratio="1/1"
                cover="ink"
              />
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ opacity: 0.75 }}>
                Fig. 02 · Yamaha · {lang === 'es' ? 'Estación de batería' : 'Drum station'}
              </p>
            </div>
            <div className="md:pl-12">
              <RevealImage
                src={IMG_SMALL_2}
                alt="Drum close-up"
                ratio="4/5"
                cover="ink"
              />
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ opacity: 0.75 }}>
                Fig. 03 · Zildjian · {lang === 'es' ? 'Detalle' : 'Detail'}
              </p>
            </div>
          </div>
        </div>

        {/* Body + pull quote */}
        <div className="grid grid-cols-12 gap-6 mb-16 md:mb-24">
          <div className="col-span-12 md:col-span-5 md:col-start-2">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.9, y: 0 }}
              viewport={{ once: true, margin: '-8%' }}
              transition={{ duration: 1, ease: ease.outExpo }}
              className="text-body-lg max-w-xl"
            >
              {content.studio.body[lang]}
            </motion.p>
          </div>
          <div className="col-span-12 md:col-span-5 md:col-start-8 md:mt-16">
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-8%' }}
              transition={{ duration: 1, ease: ease.outExpo, delay: 0.15 }}
              className="font-display text-display-sm italic-emphasis"
              style={{ letterSpacing: '-0.015em', color: 'var(--color-pearl)' }}
            >
              {content.studio.pull[lang]}
              <footer className="mt-6 font-mono text-[10px] not-italic uppercase tracking-[0.2em]" style={{ opacity: 0.78 }}>
                — Horacio Malvicino, MDG
              </footer>
            </motion.blockquote>
          </div>
        </div>

        {/* Stats grid */}
        <div className="border-t border-current/30 pt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
            {content.studio.stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-5%' }}
                transition={{ duration: 0.9, ease: ease.outExpo, delay: i * 0.08 }}
              >
                <div className="font-display text-5xl md:text-6xl mb-3" style={{ letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] max-w-[12ch]" style={{ opacity: 0.8 }}>
                  {stat.label[lang]}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Wide image at the bottom */}
        <div className="mt-16 md:mt-24">
          <RevealImage
            src={IMG_WIDE}
            alt="Malonic Records · control room"
            ratio="21/9"
            cover="ink"
          />
        </div>
      </div>
    </section>
  );
}
