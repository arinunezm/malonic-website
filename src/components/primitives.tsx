import React, { useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ease, dur } from '../lib/motion';

/* =========================================================================
   SCROLL PROGRESS · thin signal-green line tracking page scroll
   ========================================================================= */

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 130, damping: 22, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[101] pointer-events-none"
      style={{
        scaleX,
        background: 'var(--color-signal)',
        boxShadow: '0 0 14px rgba(0,198,41,0.45)',
      }}
    />
  );
}

/* =========================================================================
   CUSTOM CURSOR
   ========================================================================= */

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.body.classList.add('cursor-active');

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!dotRef.current) return;
      if (t.closest('[data-cursor="image"]')) {
        dotRef.current.dataset.state = 'image';
      } else if (t.closest('[data-cursor="signal"]')) {
        dotRef.current.dataset.state = 'signal';
      } else if (t.closest('a, button, [role="button"], input, textarea, select, [data-cursor="hover"]')) {
        dotRef.current.dataset.state = 'hover';
      } else {
        dotRef.current.dataset.state = '';
      }
    };

    const onLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = '0';
    };
    const onEnter = () => {
      if (dotRef.current) dotRef.current.style.opacity = '1';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    let raf = 0;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.18;
      current.current.y += (target.current.y - current.current.y) * 0.18;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(raf);
      document.body.classList.remove('cursor-active');
    };
  }, []);

  return <div ref={dotRef} className="malonic-cursor" aria-hidden="true" />;
}

/* =========================================================================
   GRAIN OVERLAY
   ========================================================================= */

export function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

/* =========================================================================
   LOADING SCREEN
   ========================================================================= */

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(onDone, reduce ? 200 : 900);
    return () => clearTimeout(t);
  }, [onDone, reduce]);

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.55, ease: ease.outExpo } }}
    >
      <div className="flex flex-col items-center gap-6">
        <motion.img
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: ease.outExpo }}
          src="/img/logo-dark.png"
          alt="Malonic Records"
          className="select-none block"
          style={{
            width: 'clamp(240px, 36vw, 380px)',
            height: 'auto',
          }}
          draggable={false}
        />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '140px', opacity: 0.45 }}
          transition={{ duration: 0.9, ease: ease.outExpo, delay: 0.15 }}
          className="h-px"
          style={{ background: 'var(--color-paper)' }}
        />
        <motion.span
          className="live-dot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          aria-hidden
        />
      </div>
    </motion.div>
  );
}

/* =========================================================================
   REVEAL TEXT — splits a line and slides it in
   ========================================================================= */

export function RevealText({
  children,
  as = 'div',
  delay = 0,
  className = '',
  duration,
}: {
  children: React.ReactNode;
  as?: 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  delay?: number;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduce = useReducedMotion();
  const Tag = as as any;

  return (
    <Tag ref={ref} className={className} style={{ overflow: 'hidden', display: 'block' }}>
      <motion.span
        style={{ display: 'inline-block', willChange: 'transform' }}
        initial={{ y: '110%' }}
        animate={inView ? { y: '0%' } : { y: '110%' }}
        transition={{
          duration: reduce ? 0.001 : (duration ?? dur.lg),
          ease: ease.reveal,
          delay: reduce ? 0 : delay,
        }}
      >
        {children}
      </motion.span>
    </Tag>
  );
}

/* multi-line reveal — pass an array of strings */
export function RevealLines({
  lines,
  className = '',
  lineClassName = '',
  staggerMs = 70,
  startDelay = 0,
  as = 'div',
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  staggerMs?: number;
  startDelay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'div';
}) {
  const Tag = as as any;
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <RevealText
          key={i}
          delay={startDelay + (i * staggerMs) / 1000}
          className={lineClassName}
        >
          {line}
        </RevealText>
      ))}
    </Tag>
  );
}

/* =========================================================================
   REVEAL IMAGE — masked entrance with scale
   ========================================================================= */

export function RevealImage({
  src,
  alt,
  ratio = '4/5',
  className = '',
  cover = 'paper',
  parallax = 0,
}: {
  src: string;
  alt: string;
  ratio?: string;
  className?: string;
  cover?: 'paper' | 'ink' | 'smoke';
  parallax?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const reduce = useReducedMotion();

  const coverColor =
    cover === 'paper' ? 'var(--color-paper)' :
    cover === 'smoke' ? 'var(--color-smoke)' :
    'var(--color-ink)';

  return (
    <div
      ref={ref}
      data-cursor="image"
      className={`cine-frame ${className}`}
      style={{ aspectRatio: ratio, position: 'relative' }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="cine-img"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        initial={{ scale: 1.18, y: parallax * 30 }}
        animate={inView ? { scale: 1, y: 0 } : { scale: 1.18 }}
        transition={{
          duration: reduce ? 0.001 : 1.6,
          ease: ease.outExpo,
        }}
      />
      <motion.div
        aria-hidden
        className="reveal-mask"
        style={{ background: coverColor }}
        initial={{ y: '0%' }}
        animate={inView ? { y: '-101%' } : { y: '0%' }}
        transition={{
          duration: reduce ? 0.001 : 1.4,
          ease: ease.reveal,
        }}
      />
    </div>
  );
}

/* =========================================================================
   MAGNETIC BUTTON
   ========================================================================= */

export function MagneticButton({
  children,
  className = '',
  href,
  onClick,
  variant = 'outline',
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'outline' | 'ghost' | 'fill';
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const radius = Math.max(r.width, r.height) * 0.9;
      if (d < radius) {
        target = { x: dx * 0.25, y: dy * 0.4 };
      } else {
        target = { x: 0, y: 0 };
      }
    };

    const tick = () => {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      el.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      el.style.transform = '';
    };
  }, [reduce]);

  const base = 'inline-flex items-center gap-3 px-6 py-3 text-[11px] uppercase tracking-[0.18em] transition-colors duration-500';
  const variants = {
    outline: 'border border-current hover:bg-current hover:text-[color:var(--color-ink)]',
    ghost: 'underline-offset-4 hover:underline',
    fill: 'bg-current text-[color:var(--color-ink)] hover:opacity-90',
  };
  const cn = `${base} ${variants[variant]} ${className}`.trim();

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={cn}
        aria-label={ariaLabel}
        style={{ willChange: 'transform' }}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={cn}
      aria-label={ariaLabel}
      style={{ willChange: 'transform' }}
    >
      {children}
    </button>
  );
}

/* =========================================================================
   MARQUEE — infinite horizontal loop
   ========================================================================= */

export function Marquee({ children, speed = 50 }: { children: React.ReactNode; speed?: number }) {
  return (
    <div className="overflow-hidden w-full">
      <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}

/* =========================================================================
   SECTION THEME WATCHER — flip body bg/color when section enters viewport
   ========================================================================= */

export function useSectionTheme<T extends HTMLElement = HTMLElement>(theme: 'dark' | 'paper' | 'smoke') {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
            document.body.dataset.theme = theme;
          }
        });
      },
      { threshold: [0, 0.45, 0.6, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [theme]);
  return ref;
}

/* =========================================================================
   TINY UI ATOMS
   ========================================================================= */

export function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`label ${className}`}>{children}</span>;
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`divider-thin w-full ${className}`} />;
}
