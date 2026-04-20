import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLang, content } from '../lib/i18n';
import { ease } from '../lib/motion';

export function Wordmark({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const h = size === 'lg' ? 48 : 32;
  return (
    <span
      role="img"
      aria-label="Malonic Records"
      className="relative block select-none pointer-events-none"
      style={{ width: `${Math.round(h * 2.95)}px`, height: `${h}px` }}
    >
      <img
        className="malonic-logo"
        data-variant="light"
        src="/img/logo-light.png"
        alt=""
        draggable={false}
      />
      <img
        className="malonic-logo absolute inset-0"
        data-variant="dark"
        src="/img/logo-dark.png"
        alt=""
        draggable={false}
      />
    </span>
  );
}

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { lang, setLang } = useLang();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: ease.outExpo, delay: 0.6 }}
        className="fixed top-0 left-0 right-0 z-[100]"
        style={{
          backdropFilter: isScrolled ? 'blur(14px)' : 'none',
          background: isScrolled ? 'color-mix(in srgb, var(--color-ink) 78%, transparent)' : 'transparent',
          borderBottom: isScrolled ? '1px solid color-mix(in srgb, currentColor 8%, transparent)' : '1px solid transparent',
          transition: 'background 600ms var(--ease-primary), border-color 600ms var(--ease-primary), backdrop-filter 600ms var(--ease-primary)',
        }}
      >
        <div className="container-x flex items-center justify-between h-[72px] md:h-[88px]">
          <a href="#top" className="flex items-center gap-3" data-cursor="hover" aria-label="Malonic Records · home">
            <Wordmark />
            <span className="hidden md:flex items-center gap-2 ml-2 pl-4 border-l border-current/20">
              <span className="live-dot" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-60">
                {content.nav.live[lang]}
              </span>
            </span>
          </a>

          <div className="hidden md:flex items-center gap-12">
            <ul className="flex items-center gap-10">
              {content.nav.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    data-cursor="hover"
                    className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70 hover:opacity-100 transition-opacity duration-300 group inline-flex items-center gap-2"
                  >
                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">·</span>
                    {item.label[lang]}
                  </a>
                </li>
              ))}
            </ul>

            <LangToggle lang={lang} setLang={setLang} />
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex flex-col gap-[6px] p-2"
            data-cursor="hover"
          >
            <span className={`block h-px w-7 bg-current transition-transform duration-500 ${open ? 'translate-y-[3.5px] rotate-45' : ''}`} />
            <span className={`block h-px w-7 bg-current transition-transform duration-500 ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: ease.outExpo }}
            className="fixed inset-0 z-[99] flex flex-col justify-between md:hidden"
            style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
          >
            <div className="h-[72px]" />
            <ul className="flex flex-col gap-6 px-6">
              {content.nav.items.map((item, i) => (
                <li key={item.id} style={{ overflow: 'hidden' }}>
                  <motion.a
                    initial={{ y: '110%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 0.9, ease: ease.reveal, delay: 0.1 + i * 0.07 }}
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    className="block font-display text-5xl lowercase"
                    style={{ letterSpacing: '-0.025em', color: 'var(--color-paper)' }}
                  >
                    {item.label[lang]}
                  </motion.a>
                </li>
              ))}
            </ul>
            <div className="px-6 pb-12 flex items-center justify-between">
              <LangToggle lang={lang} setLang={setLang} />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">
                hello@malonicrecords.com
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LangToggle({ lang, setLang }: { lang: 'es' | 'en'; setLang: (l: 'es' | 'en') => void }) {
  return (
    <div className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.2em]" data-cursor="hover">
      <button
        type="button"
        onClick={() => setLang('es')}
        aria-pressed={lang === 'es'}
        className="px-1 transition-opacity"
        style={{ opacity: lang === 'es' ? 1 : 0.4, fontWeight: lang === 'es' ? 500 : 400 }}
      >
        ES
      </button>
      <span className="opacity-30">/</span>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className="px-1 transition-opacity"
        style={{ opacity: lang === 'en' ? 1 : 0.4, fontWeight: lang === 'en' ? 500 : 400 }}
      >
        EN
      </button>
    </div>
  );
}
