import React, { useEffect } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import { useLang, content } from '../lib/i18n';
import { ease, dur } from '../lib/motion';
import { MagneticButton, useSectionTheme, Label } from '../components/primitives';

const HERO_IMG = '/img/hero-controlroom.jpg';

export function Hero() {
  const ref = useSectionTheme<HTMLElement>('dark');
  const { lang } = useLang();
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 800], [0, 140]);
  const imgScale = useTransform(scrollY, [0, 800], [1, 1.08]);
  const fade = useTransform(scrollY, [0, 600], [1, 0.2]);

  // Cursor spotlight — follows pointer with spring for organic feel
  const spotX = useMotionValue(0.5);
  const spotY = useMotionValue(0.35);
  const spotXSpring = useSpring(spotX, { stiffness: 120, damping: 25, mass: 0.6 });
  const spotYSpring = useSpring(spotY, { stiffness: 120, damping: 25, mass: 0.6 });
  const spotGradient = useTransform([spotXSpring, spotYSpring], ([x, y]) =>
    `radial-gradient(circle 42vmax at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(0,198,41,0.10) 0%, rgba(0,198,41,0.04) 25%, rgba(10,10,10,0) 55%)`
  );

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      spotX.set(Math.max(0, Math.min(1, x)));
      spotY.set(Math.max(0, Math.min(1, y)));
    };
    el.addEventListener('mousemove', onMove, { passive: true });
    return () => el.removeEventListener('mousemove', onMove);
  }, [ref, spotX, spotY]);

  const lines = content.hero.headline[lang];

  return (
    <section
      id="top"
      ref={ref}
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      {/* Background image with parallax + idle breathing */}
      <motion.div
        className="absolute inset-0"
        style={{ y: imgY, scale: imgScale, opacity: fade }}
      >
        <motion.img
          src={HERO_IMG}
          alt=""
          aria-hidden
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover"
          style={{ filter: 'grayscale(20%) contrast(1.08) brightness(0.6)' }}
          animate={{ scale: [1, 1.025, 1] }}
          transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.35) 30%, rgba(10,10,10,0.55) 70%, rgba(10,10,10,1) 100%)',
          }}
        />
      </motion.div>

      {/* Cursor-following green spotlight wash */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: spotGradient, mixBlendMode: 'screen' }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top eyebrow */}
        <div className="container-x pt-[140px] md:pt-[180px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: ease.outExpo, delay: 0.9 }}
            className="flex items-center justify-between gap-4 pb-12 border-b border-current/15"
          >
            <Label className="opacity-80">
              <span className="live-dot mr-3" />
              {content.hero.eyebrow}
            </Label>
            <Label className="opacity-60 hidden sm:inline-block">
              {content.hero.location[lang]}
            </Label>
          </motion.div>
        </div>

        {/* Headline */}
        <div className="container-x flex-1 flex flex-col justify-end pb-[12vh] md:pb-[14vh] pt-[8vh]">
          <h1 className="font-display text-display-xl mb-10 md:mb-14" style={{ letterSpacing: '-0.04em', lineHeight: 0.86 }}>
            {lines.map((line, i) => (
              <span key={i} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: dur.lg, ease: ease.reveal, delay: 0.8 + i * 0.08 }}
                  style={{ willChange: 'transform' }}
                >
                  {/* second line gets italic emphasis */}
                  {i === lines.length - 1 ? <em className="italic-emphasis">{line}</em> : line}
                </motion.span>
              </span>
            ))}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: ease.outExpo, delay: 1.4 }}
              className="md:col-span-6 lg:col-span-5 text-body-lg max-w-xl opacity-80"
            >
              {content.hero.subhead[lang]}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: ease.outExpo, delay: 1.55 }}
              className="md:col-span-6 lg:col-span-7 flex flex-wrap gap-4 md:justify-end items-center"
            >
              <MagneticButton href="#booking" variant="outline">
                {content.hero.ctaPrimary[lang]}
                <Arrow />
              </MagneticButton>
              <MagneticButton href="#studio" variant="ghost">
                {content.hero.ctaSecondary[lang]}
                <Arrow />
              </MagneticButton>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
          className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-50">
              {content.hero.scroll[lang]}
            </span>
            <motion.span
              className="block w-px h-10 origin-top"
              style={{ background: 'var(--color-paper)' }}
              animate={{ scaleY: [0.2, 1, 0.2], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
    </svg>
  );
}
