/**
 * Malonic Records · /admin
 *
 * Single-page CRM shell mounted when the URL pathname is `/admin`.
 * Two states gate-controlled by `unlocked`:
 *   1. AccessCard3D — perspective + parallax tilt, flips on submit to reveal access.
 *   2. AdminDashboard — sidebar + sections in Malonic's ink/paper/signal palette.
 *
 * Design rules (in-line with src/index.css tokens):
 *   - No new colors. Accent is always var(--color-signal). Status/legibility uses brass/pearl/paper.
 *   - Fraunces for displays/numbers · JetBrains Mono for labels · Inter for body.
 *   - 3D primitives (.perspective-1200 / .preserve-3d / .backface-hidden) live in index.css.
 */

import React, { useEffect, useMemo, useState, type FormEvent, type SVGProps } from 'react';
import { animate, motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { ease, dur } from '../lib/motion';
import { Wordmark } from '../components/Nav';
import {
  ACCENT_BG,
  ACCENT_FG,
  ACCENT_SOFT,
  ACTIVITIES,
  AVG_TICKET,
  BOOKINGS,
  CAL_DAYS,
  CAL_END_HOUR,
  CAL_START_HOUR,
  CALENDAR_WEEK_LABEL,
  CLIENTS,
  CURRENT_MONTH_REVENUE,
  ENGINEERS,
  MONTHLY_REVENUE,
  RECEIVABLES,
  ROOMS,
  ROOM_BY_ID,
  SERVICES,
  TOTAL_DEPOSITS_HELD,
  TOTAL_OVERDUE,
  TOTAL_RECEIVABLE,
  WEEKLY_HOURS,
  balanceOf,
  formatDateMX,
  formatMXN,
  initialsOf,
  parseHour,
  type AvatarAccent,
  type Availability,
  type BookingStatus,
  type PaymentStatus,
  type Service,
} from '../lib/admin-data';

const ACCESS_BG = '/img/studio-controlroom-purple.jpg';

/* ─────────────────────────────────────────────────────────────────────────
 * Icons · 1.25rem default, currentColor stroke. Inline SVGs keep zero deps
 * and respond to text color.
 * ───────────────────────────────────────────────────────────────────────── */

type IconProps = SVGProps<SVGSVGElement>;
const baseIcon = (props: IconProps) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});
const IconDashboard = (p: IconProps) => (
  <svg {...baseIcon(p)}><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
);
const IconBookings = (p: IconProps) => (
  <svg {...baseIcon(p)}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
const IconUsers = (p: IconProps) => (
  <svg {...baseIcon(p)}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const IconCalendar = (p: IconProps) => (
  <svg {...baseIcon(p)}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 14h.01M13 14h.01M17 14h.01M9 18h.01M13 18h.01M17 18h.01" /></svg>
);
const IconRevenue = (p: IconProps) => (
  <svg {...baseIcon(p)}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);
const IconSettings = (p: IconProps) => (
  <svg {...baseIcon(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);
const IconHeadphones = (p: IconProps) => (
  <svg {...baseIcon(p)}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1v-7h3zM3 19a2 2 0 0 0 2 2h1v-7H3z" /></svg>
);
const IconSearch = (p: IconProps) => (
  <svg {...baseIcon(p)}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
const IconArrowUp = (p: IconProps) => (
  <svg {...baseIcon(p)}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
);
const IconCheck = (p: IconProps) => (
  <svg {...baseIcon(p)}><polyline points="20 6 9 17 4 12" /></svg>
);
const IconArrowLeft = (p: IconProps) => (
  <svg {...baseIcon(p)}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
);
const IconLock = (p: IconProps) => (
  <svg {...baseIcon(p)}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const IconPlus = (p: IconProps) => (
  <svg {...baseIcon(p)}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const IconClock = (p: IconProps) => (
  <svg {...baseIcon(p)}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);
const IconAlert = (p: IconProps) => (
  <svg {...baseIcon(p)}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
const IconSpeaker = (p: IconProps) => (
  <svg {...baseIcon(p)}><rect x="6" y="2" width="12" height="20" rx="2" /><circle cx="12" cy="14" r="4" /><line x1="12" y1="6" x2="12.01" y2="6" /></svg>
);

/* ─────────────────────────────────────────────────────────────────────────
 * AccessCard3D — perspective + parallax tilt + flip-to-unlock
 * ───────────────────────────────────────────────────────────────────────── */

function AccessCard3D({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Flip rotation (0 → 180) is animated imperatively on submit.
  const flipY = useMotionValue(0);
  // Hover tilt (limited range) tracks the cursor; springed for an organic feel.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const tiltXSpring = useSpring(tiltX, { stiffness: 160, damping: 22, mass: 0.5 });
  const tiltYSpring = useSpring(tiltY, { stiffness: 160, damping: 22, mass: 0.5 });

  // Sum flip + tilt into one rotateY motion value.
  const rotateY = useTransform([flipY, tiltYSpring] as ReadonlyArray<ReturnType<typeof useMotionValue>>, (vals) => {
    const [f, t] = vals as [number, number];
    return f + t;
  });

  // Light source — a soft sheen that follows the pointer.
  const sheenX = useMotionValue(50);
  const sheenY = useMotionValue(30);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (submitting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    tiltY.set((px - 0.5) * 16);
    tiltX.set((0.5 - py) * 12);
    sheenX.set(px * 100);
    sheenY.set(py * 100);
  };

  const handleLeave = () => {
    if (submitting) return;
    tiltX.set(0);
    tiltY.set(0);
    sheenX.set(50);
    sheenY.set(30);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    tiltX.set(0);
    tiltY.set(0);
    // Flip to reveal the success back face, then hand off to the dashboard.
    animate(flipY, 180, { duration: 0.9, ease: ease.reveal });
    window.setTimeout(onUnlock, 1500);
  };

  const sheen = useTransform([sheenX, sheenY] as ReadonlyArray<ReturnType<typeof useMotionValue>>, (vals) => {
    const [x, y] = vals as [number, number];
    return `radial-gradient(circle 60% at ${x}% ${y}%, rgba(245,243,238,0.10) 0%, rgba(245,243,238,0.02) 35%, rgba(10,10,10,0) 75%)`;
  });

  return (
    <div className="relative w-full max-w-[540px] mx-auto perspective-1200">
      <motion.div
        className="relative preserve-3d"
        style={{
          width: '100%',
          aspectRatio: '5 / 7',
          maxHeight: '78vh',
          rotateX: tiltXSpring,
          rotateY,
        }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: dur.lg, ease: ease.outExpo, delay: 0.1 }}
      >
        {/* ── FRONT FACE ──────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 backface-hidden rounded-[20px] overflow-hidden glow-signal-soft"
          style={{
            background:
              'linear-gradient(160deg, color-mix(in srgb, var(--color-smoke) 96%, transparent) 0%, color-mix(in srgb, var(--color-ink) 92%, transparent) 100%)',
            border: '1px solid color-mix(in srgb, var(--color-paper) 8%, transparent)',
          }}
          data-cursor="hover"
        >
          {/* Sheen layer that tracks the cursor */}
          <motion.div className="absolute inset-0 pointer-events-none" style={{ background: sheen }} />
          {/* Subtle scanline */}
          <span className="scanline" aria-hidden />
          {/* Signal corner mark */}
          <div className="absolute top-5 right-5 flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: 'var(--color-cloud)' }}>
            <span className="live-dot" /> Live · Estudio
          </div>

          <div className="relative h-full p-7 md:p-10 flex flex-col justify-between">
            {/* Header */}
            <div className="flex flex-col gap-6">
              <Wordmark size="sm" />
              <div className="flex items-center gap-3">
                <span className="label" style={{ color: 'var(--color-cloud)' }}>Admin Access · CRM</span>
              </div>
              <h2 className="font-display text-[clamp(2rem,4.6vw,3rem)] leading-[0.92]" style={{ letterSpacing: '-0.025em', color: 'var(--color-paper)' }}>
                Sala de <span className="italic-emphasis">control.</span>
              </h2>
              <p className="text-[0.92rem] max-w-[36ch]" style={{ color: 'var(--color-cloud)' }}>
                Acceso restringido al panel de reservaciones, clientes y operación del estudio.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div
                className="field"
                style={{
                  borderColor: 'color-mix(in srgb, var(--color-paper) 22%, transparent)',
                  color: 'var(--color-pearl)',
                }}
              >
                <label htmlFor="admin-pass" style={{ color: 'var(--color-cloud)' }}>Contraseña</label>
                <input
                  id="admin-pass"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  style={{ color: 'var(--color-paper)' }}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative inline-flex items-center gap-3 px-5 py-3 rounded-full transition-all"
                  style={{
                    background: 'var(--color-signal)',
                    color: 'var(--color-ink)',
                    boxShadow: '0 12px 36px -14px rgba(0,198,41,0.55)',
                  }}
                  data-cursor="signal"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] font-medium">
                    {submitting ? 'Verificando…' : 'Acceder'}
                  </span>
                  <IconLock width={14} height={14} strokeWidth={1.8} />
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-mist)' }}>
                  Demo · cualquier contraseña funciona
                </span>
              </div>
            </form>

            {/* Footer mono mark */}
            <div className="flex items-center justify-between pt-6" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-paper) 8%, transparent)' }}>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist) ' }}>
                SVC-057 · CRM
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>
                MTY · MX
              </span>
            </div>
          </div>
        </div>

        {/* ── BACK FACE ───────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 backface-hidden rounded-[20px] overflow-hidden glow-signal"
          style={{
            transform: 'rotateY(180deg)',
            background:
              'linear-gradient(160deg, color-mix(in srgb, var(--color-smoke) 92%, transparent) 0%, color-mix(in srgb, var(--color-ink) 96%, transparent) 100%)',
            border: '1px solid color-mix(in srgb, var(--color-signal) 22%, transparent)',
          }}
        >
          <span className="scanline" aria-hidden />
          <div className="relative h-full p-10 flex flex-col items-center justify-center gap-8 text-center">
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--color-signal) 18%, transparent)', color: 'var(--color-signal)' }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6, ease: ease.outExpo }}
            >
              <IconCheck width={28} height={28} strokeWidth={2} />
            </motion.div>
            <div className="space-y-3">
              <span className="label" style={{ color: 'var(--color-signal)' }}>Acceso concedido</span>
              <h3 className="font-display text-[clamp(1.8rem,4vw,2.6rem)]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.022em' }}>
                Bienvenido, <span className="italic-emphasis">admin.</span>
              </h3>
              <p className="text-[0.9rem]" style={{ color: 'var(--color-cloud)' }}>
                Cargando panel de control…
              </p>
            </div>
            <motion.div
              className="h-px"
              style={{ background: 'var(--color-signal)' }}
              initial={{ width: 0 }}
              animate={{ width: '160px' }}
              transition={{ delay: 0.7, duration: 0.8, ease: ease.outExpo }}
            />
          </div>
        </div>
      </motion.div>

      {/* Soft reflection floor under the card to reinforce Z-depth */}
      <div
        aria-hidden
        className="absolute left-0 right-0"
        style={{
          bottom: '-12%',
          height: '24%',
          background: 'radial-gradient(ellipse at center top, rgba(0,198,41,0.10) 0%, rgba(10,10,10,0) 65%)',
          filter: 'blur(6px)',
          opacity: 0.85,
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * AccessScreen — page-level chrome around the 3D card.
 * Uses studio-controlroom-purple as a heavily darkened, blurred backdrop.
 * ───────────────────────────────────────────────────────────────────────── */

function AccessScreen({ onUnlock }: { onUnlock: () => void }) {
  return (
    <section
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      {/* Background image — blurred, dark, cinematic */}
      <img
        src={ACCESS_BG}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'blur(28px) brightness(0.42) saturate(1.05)', transform: 'scale(1.12)' }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.78) 50%, rgba(10,10,10,0.96) 100%)',
        }}
      />
      <div aria-hidden className="absolute inset-0 bg-hairline-grid opacity-40" />

      {/* Header row — back to site + lang mark */}
      <div className="absolute top-0 left-0 right-0 z-10 container-x h-[72px] flex items-center justify-between">
        <a
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] opacity-70 hover:opacity-100 transition-opacity"
          data-cursor="hover"
        >
          <IconArrowLeft width={14} height={14} />
          Regresar al sitio
        </a>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">
          malonicrecords.com / admin
        </span>
      </div>

      <div className="relative z-10 w-full container-x py-[10vh]">
        <AccessCard3D onUnlock={onUnlock} />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Dashboard sub-components
 * ───────────────────────────────────────────────────────────────────────── */

type PageId = 'dashboard' | 'bookings' | 'clients' | 'calendar' | 'revenue' | 'services' | 'team';

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Panel general',
  bookings: 'Reservaciones',
  clients: 'Clientes',
  calendar: 'Calendario',
  revenue: 'Ingresos',
  services: 'Servicios',
  team: 'Equipo',
};

function AdminSidebar({ page, setPage, onLock }: { page: PageId; setPage: (p: PageId) => void; onLock: () => void }) {
  const items: { id: PageId; label: string; Icon: (p: IconProps) => React.JSX.Element; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard',     Icon: IconDashboard },
    { id: 'bookings',  label: 'Reservaciones', Icon: IconBookings, badge: 2 },
    { id: 'clients',   label: 'Clientes',      Icon: IconUsers },
    { id: 'calendar',  label: 'Calendario',    Icon: IconCalendar },
    { id: 'revenue',   label: 'Ingresos',      Icon: IconRevenue },
  ];
  const settings: { id: PageId; label: string; Icon: (p: IconProps) => React.JSX.Element }[] = [
    { id: 'services', label: 'Servicios', Icon: IconSettings },
    { id: 'team',     label: 'Equipo',    Icon: IconHeadphones },
  ];

  return (
    <aside
      className="hidden md:flex fixed top-0 left-0 bottom-0 w-[252px] flex-col z-40"
      style={{
        background: 'color-mix(in srgb, var(--color-ink) 96%, var(--color-paper) 4%)',
        borderRight: '1px solid color-mix(in srgb, var(--color-paper) 6%, transparent)',
      }}
    >
      <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 6%, transparent)' }}>
        <div className="h-8 mb-3">
          <Wordmark size="sm" />
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--color-cloud)' }}>
          <span className="live-dot" /> CRM · Admin
        </div>
      </div>

      <nav className="flex-1 py-5 overflow-y-auto">
        <div className="px-6 pb-2 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--color-mist)' }}>Principal</div>
        {items.map(({ id, label, Icon, badge }) => {
          const active = page === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPage(id)}
              data-cursor="hover"
              className="group relative flex items-center gap-3 w-full text-left px-6 py-2.5 transition-colors"
              style={{
                color: active ? 'var(--color-paper)' : 'var(--color-cloud)',
                background: active ? 'color-mix(in srgb, var(--color-signal) 8%, transparent)' : 'transparent',
              }}
            >
              <span
                aria-hidden
                className="absolute left-0 top-1.5 bottom-1.5 w-[2px] transition-opacity"
                style={{ background: 'var(--color-signal)', opacity: active ? 1 : 0 }}
              />
              <Icon width={16} height={16} />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{label}</span>
              {badge ? (
                <span
                  className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'var(--color-signal)',
                    color: 'var(--color-ink)',
                    fontWeight: 600,
                  }}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}

        <div className="px-6 pt-6 pb-2 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--color-mist)' }}>Configuración</div>
        {settings.map(({ id, label, Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPage(id)}
              data-cursor="hover"
              className="relative flex items-center gap-3 w-full text-left px-6 py-2.5 transition-colors"
              style={{
                color: active ? 'var(--color-paper)' : 'var(--color-cloud)',
                background: active ? 'color-mix(in srgb, var(--color-signal) 8%, transparent)' : 'transparent',
              }}
            >
              <span
                aria-hidden
                className="absolute left-0 top-1.5 bottom-1.5 w-[2px]"
                style={{ background: 'var(--color-signal)', opacity: active ? 1 : 0 }}
              />
              <Icon width={16} height={16} />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-6 py-4 flex items-center gap-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-paper) 6%, transparent)' }}>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-[11px] font-medium"
          style={{ background: ACCENT_BG.signal, color: 'var(--color-ink)' }}
        >
          MR
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[0.82rem] truncate" style={{ color: 'var(--color-paper)' }}>Malonic Records</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-mist)' }}>Administrador</div>
        </div>
        <button
          type="button"
          onClick={onLock}
          className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-60 hover:opacity-100 transition-opacity"
          data-cursor="hover"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          Salir
        </button>
      </div>
    </aside>
  );
}

function Topbar({ page }: { page: PageId }) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-6 px-6 md:px-10 h-[72px]"
      style={{
        background: 'color-mix(in srgb, var(--color-ink) 78%, transparent)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)',
      }}
    >
      <div className="flex items-baseline gap-4">
        <h1 className="font-display text-[1.4rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.018em' }}>
          {PAGE_TITLES[page]}
        </h1>
        <span className="hidden sm:inline-flex font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--color-mist)' }}>
          21 may · semana 21
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full w-[260px]"
          style={{
            background: 'color-mix(in srgb, var(--color-paper) 4%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-paper) 8%, transparent)',
          }}
        >
          <IconSearch width={14} height={14} />
          <input
            type="search"
            placeholder="Buscar cliente, reservación…"
            className="bg-transparent outline-none border-0 text-[0.85rem] w-full"
            style={{ color: 'var(--color-paper)' }}
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ background: 'var(--color-signal)', color: 'var(--color-ink)' }}
          data-cursor="signal"
        >
          <IconPlus width={14} height={14} />
          Nueva reserva
        </button>
      </div>
    </header>
  );
}

type Kpi = {
  Icon: (p: IconProps) => React.JSX.Element;
  value: string;
  label: string;
  delta: string;
  alert?: boolean;
};

function KPIGrid() {
  const kpis: Kpi[] = [
    { Icon: IconCalendar,   value: '6',                                 label: 'Sesiones esta semana', delta: '+20%' },
    { Icon: IconRevenue,    value: `$${Math.round(CURRENT_MONTH_REVENUE / 1000)}K`, label: 'Revenue mensual', delta: '+15%' },
    { Icon: IconAlert,      value: `$${(TOTAL_RECEIVABLE / 1000).toFixed(1)}K`,     label: 'Por cobrar', delta: `${formatMXN(TOTAL_OVERDUE)} vencido`, alert: true },
    { Icon: IconHeadphones, value: '72%',                               label: 'Ocupación estudio',    delta: '+8%' },
  ];
  return (
    <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      {kpis.map(({ Icon, value, label, delta, alert }, i) => {
        const accent = alert ? 'var(--color-brass)' : 'var(--color-signal)';
        const accentSoft = alert
          ? 'color-mix(in srgb, var(--color-brass) 16%, transparent)'
          : 'color-mix(in srgb, var(--color-signal) 12%, transparent)';
        return (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur.md, ease: ease.outExpo, delay: 0.05 + i * 0.04 }}
            whileHover={{ y: -2 }}
            className="relative overflow-hidden rounded-[14px] p-5"
            style={{
              background: 'color-mix(in srgb, var(--color-smoke) 92%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: accentSoft, color: accent }}
              >
                <Icon width={16} height={16} />
              </div>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: accent }}>
                {alert ? <IconAlert width={11} height={11} /> : <IconArrowUp width={12} height={12} />} {delta}
              </span>
            </div>
            <div className="font-display text-[2rem] leading-none" style={{ color: 'var(--color-paper)', letterSpacing: '-0.025em' }}>
              {value}
            </div>
            <div className="mt-1.5 text-[0.78rem]" style={{ color: 'var(--color-cloud)' }}>{label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

function WeeklyChart() {
  const maxH = Math.max(...WEEKLY_HOURS.map((w) => w.hours));
  const total = WEEKLY_HOURS.reduce((acc, w) => acc + w.hours, 0);
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.md, ease: ease.outExpo, delay: 0.15 }}
      className="rounded-[14px] p-6 mb-6"
      style={{
        background: 'color-mix(in srgb, var(--color-smoke) 92%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)',
      }}
    >
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="label" style={{ color: 'var(--color-cloud)' }}>Horas de estudio</span>
          <h3 className="mt-1 font-display text-[1.2rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.018em' }}>
            Semana en curso
          </h3>
        </div>
        <div className="text-right">
          <div className="font-display text-[1.4rem]" style={{ color: 'var(--color-paper)' }}>{total}h</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-mist)' }}>Total</div>
        </div>
      </div>
      <div className="flex items-end gap-3 h-[160px] relative">
        {WEEKLY_HOURS.map((w, i) => {
          const heightPx = maxH > 0 ? (w.hours / maxH) * 130 : 2;
          const useSignal = w.hours > 10;
          return (
            <motion.div
              key={w.day}
              className="flex-1 flex flex-col items-center gap-2 group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: dur.sm, delay: 0.25 + i * 0.05 }}
            >
              <span
                className="font-mono text-[10px] tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-paper)' }}
              >
                {w.hours}h
              </span>
              <motion.div
                initial={{ height: 2 }}
                animate={{ height: Math.max(heightPx, 2) }}
                transition={{ duration: 0.7, ease: ease.outExpo, delay: 0.3 + i * 0.05 }}
                className="w-full rounded-t-[3px]"
                style={{
                  background: w.hours === 0
                    ? 'color-mix(in srgb, var(--color-paper) 6%, transparent)'
                    : useSignal
                      ? 'var(--color-signal)'
                      : 'color-mix(in srgb, var(--color-signal) 32%, var(--color-mist))',
                  maxWidth: '44px',
                }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--color-mist)' }}>
                {w.day}
              </span>
            </motion.div>
          );
        })}
        <div className="absolute left-0 right-0 bottom-[24px] h-px" style={{ background: 'color-mix(in srgb, var(--color-paper) 6%, transparent)' }} />
      </div>
    </motion.section>
  );
}

function StatusPill({ status }: { status: BookingStatus }) {
  const tones: Record<BookingStatus, { bg: string; fg: string; label: string }> = {
    confirmed: {
      bg: 'color-mix(in srgb, var(--color-signal) 14%, transparent)',
      fg: 'var(--color-signal)',
      label: 'Confirmada',
    },
    pending: {
      bg: 'color-mix(in srgb, var(--color-brass) 18%, transparent)',
      fg: 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))',
      label: 'Pendiente',
    },
    cancelled: {
      bg: 'color-mix(in srgb, var(--color-paper) 8%, transparent)',
      fg: 'var(--color-cloud)',
      label: 'Cancelada',
    },
    completed: {
      bg: 'color-mix(in srgb, var(--color-pearl) 14%, transparent)',
      fg: 'var(--color-pearl)',
      label: 'Completada',
    },
  };
  const t = tones[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.16em]" style={{ background: t.bg, color: t.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
      {t.label}
    </span>
  );
}

function BookingsTable() {
  const [tab, setTab] = useState<'all' | BookingStatus>('all');
  const filtered = useMemo(() => (tab === 'all' ? BOOKINGS : BOOKINGS.filter((b) => b.status === tab)), [tab]);

  const tabs: { id: 'all' | BookingStatus; label: string }[] = [
    { id: 'all',       label: 'Todas' },
    { id: 'pending',   label: 'Pendientes' },
    { id: 'confirmed', label: 'Confirmadas' },
    { id: 'completed', label: 'Completadas' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.md, ease: ease.outExpo, delay: 0.2 }}
      className="rounded-[14px] overflow-hidden"
      style={{
        background: 'color-mix(in srgb, var(--color-smoke) 92%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)',
      }}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)' }}>
        <h3 className="font-display text-[1.05rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.012em' }}>
          Reservaciones
        </h3>
        <div className="inline-flex p-[3px] rounded-full" style={{ background: 'color-mix(in srgb, var(--color-paper) 5%, transparent)' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              data-cursor="hover"
              className="px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.16em] transition-all"
              style={{
                background: tab === t.id ? 'color-mix(in srgb, var(--color-signal) 16%, transparent)' : 'transparent',
                color: tab === t.id ? 'var(--color-signal)' : 'var(--color-cloud)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[680px]">
          <thead>
            <tr>
              {['Cliente', 'Servicio', 'Fecha', 'Duración', 'Monto', 'Estado'].map((h) => (
                <th
                  key={h}
                  className="text-left font-mono text-[10px] uppercase tracking-[0.18em] px-5 py-3"
                  style={{ color: 'var(--color-mist)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="transition-colors hover:bg-white/[0.02]" data-cursor="hover">
                <td className="px-5 py-3.5" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-[10px] font-medium"
                      style={{ background: ACCENT_BG[b.accent], color: 'var(--color-ink)' }}
                    >
                      {initialsOf(b.client)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.86rem]" style={{ color: 'var(--color-paper)' }}>{b.client}</div>
                      <div className="text-[0.74rem]" style={{ color: 'var(--color-mist)' }}>{b.project}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[0.82rem]" style={{ color: 'var(--color-cloud)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>
                  {b.service}
                </td>
                <td className="px-5 py-3.5 font-mono text-[0.78rem]" style={{ color: 'var(--color-cloud)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>
                  {formatDateMX(b.date)} · {b.time}
                </td>
                <td className="px-5 py-3.5 font-mono text-[0.78rem]" style={{ color: 'var(--color-cloud)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>
                  {b.duration} hrs
                </td>
                <td className="px-5 py-3.5 font-display text-[0.95rem]" style={{ color: 'var(--color-paper)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>
                  ${formatMXN(b.amount)}
                </td>
                <td className="px-5 py-3.5" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>
                  <StatusPill status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

function ActivityFeed() {
  const toneColor: Record<NonNullable<typeof ACTIVITIES[number]['tone']>, string> = {
    signal: 'var(--color-signal)',
    brass: 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))',
    pearl: 'var(--color-pearl)',
    paper: 'var(--color-paper)',
  };
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.md, ease: ease.outExpo, delay: 0.25 }}
      className="rounded-[14px] overflow-hidden"
      style={{
        background: 'color-mix(in srgb, var(--color-smoke) 92%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)',
      }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)' }}>
        <h3 className="font-display text-[1.05rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.012em' }}>
          Actividad reciente
        </h3>
      </div>
      <ul className="px-5 py-3">
        {ACTIVITIES.map((a, i) => (
          <li key={i} className="flex gap-3 py-3">
            <div className="flex flex-col items-center pt-[6px]">
              <span className="w-2 h-2 rounded-full" style={{ background: toneColor[a.tone] }} />
              {i < ACTIVITIES.length - 1 ? (
                <span className="flex-1 w-px mt-1" style={{ background: 'color-mix(in srgb, var(--color-paper) 5%, transparent)' }} />
              ) : null}
            </div>
            <div className="min-w-0 pb-1">
              <div className="text-[0.85rem]" style={{ color: 'var(--color-cloud)' }} dangerouslySetInnerHTML={{ __html: a.text }} />
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] mt-0.5" style={{ color: 'var(--color-mist)' }}>
                {a.time}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2 px-5 py-4" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)' }}>
        {['Nueva reserva', 'Agregar cliente', 'Ver reportes', 'Enviar mensaje'].map((label) => (
          <button
            key={label}
            type="button"
            data-cursor="hover"
            className="px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-[0.18em] transition-all"
            style={{
              background: 'color-mix(in srgb, var(--color-paper) 4%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-paper) 8%, transparent)',
              color: 'var(--color-cloud)',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </motion.section>
  );
}

function DashboardPage() {
  return (
    <>
      <KPIGrid />
      <WeeklyChart />
      <div className="grid gap-6 [grid-template-columns:1fr] xl:[grid-template-columns:1fr_380px]">
        <BookingsTable />
        <ActivityFeed />
      </div>
    </>
  );
}

function ClientsPage() {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <span className="label" style={{ color: 'var(--color-cloud)' }}>Directorio</span>
          <h2 className="font-display text-[1.4rem] mt-1" style={{ color: 'var(--color-paper)', letterSpacing: '-0.018em' }}>
            Clientes activos
          </h2>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>
          {CLIENTS.length} registrados
        </span>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {CLIENTS.map((c) => (
          <motion.article
            key={c.name}
            whileHover={{ y: -2 }}
            className="relative rounded-[14px] p-5 transition-colors"
            style={{
              background: 'color-mix(in srgb, var(--color-smoke) 92%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)',
            }}
            data-cursor="hover"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-mono text-[11px] font-medium"
                style={{ background: ACCENT_BG[c.accent], color: 'var(--color-ink)' }}
              >
                {initialsOf(c.name)}
              </div>
              <div className="min-w-0">
                <div className="font-display text-[1rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.01em' }}>{c.name}</div>
                <div className="text-[0.74rem]" style={{ color: 'var(--color-mist)' }}>
                  {c.artist} · {c.genre} · {c.label}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)' }}>
              <Stat label="Sesiones" value={String(c.sessions)} />
              <Stat label="Revenue" value={`$${(c.revenue / 1000).toFixed(0)}K`} accent />
              <Stat label="Última" value={formatDateMX(c.lastVisit)} mono />
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

function Stat({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div>
      <div
        className={mono ? 'font-mono text-[0.85rem]' : 'font-display text-[1.05rem]'}
        style={{
          color: accent ? 'var(--color-signal)' : 'var(--color-paper)',
          letterSpacing: mono ? 0 : '-0.012em',
        }}
      >
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] mt-0.5" style={{ color: 'var(--color-mist)' }}>
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Shared section header + small badges
 * ───────────────────────────────────────────────────────────────────────── */

function SectionHead({ label, title, right }: { label: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <span className="label" style={{ color: 'var(--color-cloud)' }}>{label}</span>
        <h2 className="font-display text-[1.4rem] mt-1" style={{ color: 'var(--color-paper)', letterSpacing: '-0.018em' }}>
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

const CARD_STYLE: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--color-smoke) 92%, transparent)',
  border: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)',
};

function RoomChip({ roomId }: { roomId: keyof typeof ROOM_BY_ID }) {
  const room = ROOM_BY_ID[roomId];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-cloud)' }}>
      <span className="w-2 h-2 rounded-full" style={{ background: ACCENT_FG[room.accent] }} />
      {room.short}
    </span>
  );
}

function PaymentPill({ status }: { status: PaymentStatus }) {
  const tones: Record<PaymentStatus, { bg: string; fg: string; label: string }> = {
    paid:    { bg: 'color-mix(in srgb, var(--color-signal) 14%, transparent)', fg: 'var(--color-signal)', label: 'Pagado' },
    deposit: { bg: 'color-mix(in srgb, var(--color-pearl) 14%, transparent)',  fg: 'var(--color-pearl)',  label: 'Depósito' },
    pending: { bg: 'color-mix(in srgb, var(--color-paper) 8%, transparent)',   fg: 'var(--color-cloud)',  label: 'Sin pago' },
    overdue: { bg: 'color-mix(in srgb, var(--color-brass) 20%, transparent)',  fg: 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))', label: 'Vencido' },
  };
  const t = tones[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.16em]" style={{ background: t.bg, color: t.fg }}>
      {status === 'overdue' ? <IconAlert width={10} height={10} /> : <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />}
      {t.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * CALENDAR — weekly studio occupancy. The tool the admin lives in.
 * ───────────────────────────────────────────────────────────────────────── */

const ROW_H = 46;
const CAL_HOURS = Array.from({ length: CAL_END_HOUR - CAL_START_HOUR }, (_, i) => CAL_START_HOUR + i);

function CalendarPage() {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <SectionHead
        label="Ocupación"
        title="Calendario del estudio"
        right={
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              {ROOMS.map((r) => (
                <RoomChip key={r.id} roomId={r.id} />
              ))}
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>
              {CALENDAR_WEEK_LABEL}
            </span>
          </div>
        }
      />

      <div className="rounded-[14px] overflow-hidden" style={CARD_STYLE}>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Day header row */}
            <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 6%, transparent)' }}>
              <div />
              {CAL_DAYS.map((d) => {
                const count = BOOKINGS.filter((b) => b.date === d.key && b.status !== 'cancelled').length;
                return (
                  <div key={d.key} className="px-2 py-3 text-center" style={{ borderLeft: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)' }}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-mist)' }}>{d.label}</div>
                    <div className="font-display text-[1.05rem] mt-0.5" style={{ color: count ? 'var(--color-paper)' : 'var(--color-mist)' }}>{d.date}</div>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
              {/* Hour axis */}
              <div>
                {CAL_HOURS.map((h) => (
                  <div key={h} className="relative" style={{ height: ROW_H }}>
                    <span className="absolute -top-1.5 right-2 font-mono text-[10px]" style={{ color: 'var(--color-mist)' }}>{h}:00</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {CAL_DAYS.map((d) => {
                const dayBookings = BOOKINGS.filter((b) => b.date === d.key && b.status !== 'cancelled');
                return (
                  <div key={d.key} className="relative" style={{ borderLeft: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)', height: ROW_H * CAL_HOURS.length }}>
                    {/* Hour lines */}
                    {CAL_HOURS.map((h) => (
                      <div key={h} style={{ height: ROW_H, borderTop: '1px solid color-mix(in srgb, var(--color-paper) 4%, transparent)' }} />
                    ))}
                    {/* Booking blocks */}
                    {dayBookings.map((b) => {
                      const startH = parseHour(b.time);
                      const top = (startH - CAL_START_HOUR) * ROW_H;
                      const maxH = (CAL_END_HOUR - startH) * ROW_H;
                      const height = Math.max(30, Math.min(b.duration * ROW_H, maxH)) - 4;
                      const room = ROOM_BY_ID[b.room];
                      const accent = room.accent;
                      const endH = Math.min(startH + b.duration, CAL_END_HOUR);
                      return (
                        <div
                          key={b.id}
                          className="absolute left-1 right-1 rounded-[7px] px-2 py-1.5 overflow-hidden"
                          style={{
                            top: top + 2,
                            height,
                            background: ACCENT_SOFT[accent],
                            borderLeft: `2px solid ${ACCENT_FG[accent]}`,
                          }}
                          data-cursor="hover"
                          title={`${b.client} · ${b.service} · ${b.time}–${endH}:00 · ${room.name}`}
                        >
                          <div className="font-mono text-[9px] tracking-[0.08em]" style={{ color: ACCENT_FG[accent] }}>
                            {b.time}–{endH}:00
                          </div>
                          <div className="text-[0.74rem] truncate" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>{b.client}</div>
                          {height > 52 && (
                            <div className="text-[0.66rem] truncate" style={{ color: 'var(--color-cloud)' }}>{b.service}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * REVENUE — finance & receivables. Answers "who owes me and am I winning?"
 * ───────────────────────────────────────────────────────────────────────── */

function MiniBarChart({ data, accentFn }: { data: { label: string; value: number }[]; accentFn?: (v: number, max: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-[150px]">
      {data.map((d, i) => {
        const h = (d.value / max) * 120;
        const color = accentFn ? accentFn(d.value, max) : 'var(--color-signal)';
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2 group">
            <span className="font-mono text-[9px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-paper)' }}>
              ${Math.round(d.value / 1000)}K
            </span>
            <motion.div
              initial={{ height: 2 }}
              animate={{ height: Math.max(h, 2) }}
              transition={{ duration: 0.7, ease: ease.outExpo, delay: 0.1 + i * 0.05 }}
              className="w-full rounded-t-[3px]"
              style={{ background: color, maxWidth: '38px' }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--color-mist)' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function RevenuePage() {
  const cards = [
    { Icon: IconRevenue, value: `$${formatMXN(CURRENT_MONTH_REVENUE)}`, label: 'Revenue del mes (MXN)', accent: 'var(--color-signal)' },
    { Icon: IconAlert,   value: `$${formatMXN(TOTAL_RECEIVABLE)}`,      label: `Por cobrar · $${formatMXN(TOTAL_OVERDUE)} vencido`, accent: 'var(--color-brass)' },
    { Icon: IconClock,   value: `$${formatMXN(TOTAL_DEPOSITS_HELD)}`,   label: 'Depósitos retenidos', accent: 'var(--color-pearl)' },
    { Icon: IconRevenue, value: `$${formatMXN(AVG_TICKET)}`,            label: 'Ticket promedio', accent: 'var(--color-cloud)' },
  ];
  const byService = [...SERVICES].sort((a, b) => b.monthRevenue - a.monthRevenue);
  const maxSvc = Math.max(...byService.map((s) => s.monthRevenue), 1);

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <SectionHead label="Finanzas" title="Ingresos & cobranza" />

      {/* KPI row */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {cards.map(({ Icon, value, label, accent }) => (
          <div key={label} className="rounded-[14px] p-5" style={CARD_STYLE}>
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-5"
              style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
            >
              <Icon width={16} height={16} />
            </div>
            <div className="font-display text-[1.7rem] leading-none" style={{ color: 'var(--color-paper)', letterSpacing: '-0.025em' }}>{value}</div>
            <div className="mt-1.5 text-[0.76rem]" style={{ color: 'var(--color-cloud)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 mb-6 [grid-template-columns:1fr] lg:[grid-template-columns:1fr_1fr]">
        <div className="rounded-[14px] p-6" style={CARD_STYLE}>
          <div className="flex items-baseline justify-between mb-6">
            <h3 className="font-display text-[1.05rem]" style={{ color: 'var(--color-paper)' }}>Tendencia · 6 meses</h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-signal)' }}>+6% vs abr</span>
          </div>
          <MiniBarChart
            data={MONTHLY_REVENUE.map((m) => ({ label: m.month, value: m.revenue }))}
            accentFn={(v, max) => (v >= max ? 'var(--color-signal)' : 'color-mix(in srgb, var(--color-signal) 38%, var(--color-mist))')}
          />
        </div>

        <div className="rounded-[14px] p-6" style={CARD_STYLE}>
          <h3 className="font-display text-[1.05rem] mb-6" style={{ color: 'var(--color-paper)' }}>Ingresos por servicio</h3>
          <div className="flex flex-col gap-3.5">
            {byService.map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[0.8rem] flex items-center gap-2" style={{ color: 'var(--color-cloud)' }}>
                    {s.atmos && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-signal)' }} />}
                    {s.name}
                  </span>
                  <span className="font-mono text-[0.78rem]" style={{ color: 'var(--color-paper)' }}>${formatMXN(s.monthRevenue)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'color-mix(in srgb, var(--color-paper) 6%, transparent)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.monthRevenue / maxSvc) * 100}%` }}
                    transition={{ duration: 0.8, ease: ease.outExpo }}
                    className="h-full rounded-full"
                    style={{ background: s.atmos ? 'var(--color-signal)' : 'color-mix(in srgb, var(--color-brass) 70%, var(--color-paper))' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Receivables table */}
      <div className="rounded-[14px] overflow-hidden" style={CARD_STYLE}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)' }}>
          <h3 className="font-display text-[1.05rem]" style={{ color: 'var(--color-paper)' }}>Cuentas por cobrar</h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-brass)' }}>
            {RECEIVABLES.length} pendientes · ${formatMXN(TOTAL_RECEIVABLE)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr>
                {['Cliente', 'Servicio', 'Monto', 'Depósito', 'Balance', 'Estado'].map((h) => (
                  <th key={h} className="text-left font-mono text-[10px] uppercase tracking-[0.18em] px-5 py-3" style={{ color: 'var(--color-mist)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECEIVABLES.map((b) => (
                <tr key={b.id} className="hover:bg-white/[0.02] transition-colors" data-cursor="hover">
                  <td className="px-5 py-3.5" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[10px]" style={{ background: ACCENT_BG[b.accent], color: 'var(--color-ink)' }}>{initialsOf(b.client)}</div>
                      <span className="text-[0.85rem]" style={{ color: 'var(--color-paper)' }}>{b.client}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[0.8rem]" style={{ color: 'var(--color-cloud)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>{b.service}</td>
                  <td className="px-5 py-3.5 font-mono text-[0.8rem]" style={{ color: 'var(--color-cloud)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>${formatMXN(b.amount)}</td>
                  <td className="px-5 py-3.5 font-mono text-[0.8rem]" style={{ color: 'var(--color-cloud)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>${formatMXN(b.deposit)}</td>
                  <td className="px-5 py-3.5 font-display text-[0.95rem]" style={{ color: b.paymentStatus === 'overdue' ? 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))' : 'var(--color-paper)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>${formatMXN(balanceOf(b))}</td>
                  <td className="px-5 py-3.5" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}><PaymentPill status={b.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * SERVICES — the single pricing source of truth.
 * ───────────────────────────────────────────────────────────────────────── */

const CATEGORY_LABEL: Record<Service['category'], string> = {
  grabacion: 'Grabación',
  mezcla: 'Mezcla',
  mastering: 'Mastering',
  produccion: 'Producción',
};

function ServicesPage() {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <SectionHead
        label="Catálogo"
        title="Servicios & tarifas"
        right={<span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>{SERVICES.length} servicios · MXN</span>}
      />
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {SERVICES.map((s) => {
          const room = ROOM_BY_ID[s.room];
          return (
            <motion.article key={s.id} whileHover={{ y: -2 }} className="rounded-[14px] p-5 flex flex-col gap-4" style={CARD_STYLE} data-cursor="hover">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] mb-1" style={{ color: 'var(--color-mist)' }}>{CATEGORY_LABEL[s.category]}</div>
                  <h4 className="font-display text-[1.1rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.012em' }}>{s.name}</h4>
                </div>
                {s.atmos && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-mono text-[9px] uppercase tracking-[0.14em]" style={{ background: 'color-mix(in srgb, var(--color-signal) 14%, transparent)', color: 'var(--color-signal)' }}>
                    <IconSpeaker width={10} height={10} /> Atmos
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-[1.8rem]" style={{ color: 'var(--color-signal)', letterSpacing: '-0.025em' }}>${formatMXN(s.rate)}</span>
                <span className="font-mono text-[0.72rem]" style={{ color: 'var(--color-mist)' }}>/ {s.unit}</span>
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)' }}>
                <RoomChip roomId={room.id} />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-cloud)' }}>
                  ${Math.round(s.monthRevenue / 1000)}K este mes
                </span>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * TEAM — engineers, load and availability.
 * ───────────────────────────────────────────────────────────────────────── */

function AvailabilityBadge({ status }: { status: Availability }) {
  const tones: Record<Availability, { fg: string; label: string }> = {
    'available':  { fg: 'var(--color-signal)', label: 'Disponible' },
    'in-session': { fg: 'var(--color-brass)',  label: 'En sesión' },
    'off':        { fg: 'var(--color-mist)',   label: 'Fuera' },
  };
  const t = tones[status];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: t.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
      {t.label}
    </span>
  );
}

function TeamPage() {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <SectionHead
        label="Equipo"
        title="Ingenieros"
        right={<span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>{ENGINEERS.length} en nómina</span>}
      />
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {ENGINEERS.map((e) => (
          <motion.article key={e.id} whileHover={{ y: -2 }} className="rounded-[14px] p-5" style={CARD_STYLE} data-cursor="hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-mono text-[11px] font-medium" style={{ background: ACCENT_BG[e.accent], color: 'var(--color-ink)' }}>
                {initialsOf(e.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[1rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.01em' }}>{e.name}</span>
                  {e.atmosCertified && <IconSpeaker width={13} height={13} style={{ color: 'var(--color-signal)' }} />}
                </div>
                <div className="text-[0.74rem]" style={{ color: 'var(--color-mist)' }}>{e.role}</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 mb-3" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)', paddingBottom: '0.75rem' }}>
              <AvailabilityBadge status={e.availability} />
              {e.atmosCertified && <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-cloud)' }}>Atmos certificado</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Sesiones / mes" value={String(e.sessionsMonth)} />
              <Stat label="Horas / mes" value={`${e.hoursMonth}h`} accent />
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

function AdminDashboard({ onLock }: { onLock: () => void }) {
  const [page, setPage] = useState<PageId>('dashboard');
  return (
    <div
      className="relative min-h-screen w-full"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <div aria-hidden className="absolute inset-0 bg-hairline-grid opacity-30 pointer-events-none" />
      <AdminSidebar page={page} setPage={setPage} onLock={onLock} />
      <div className="md:ml-[252px] relative">
        <Topbar page={page} />
        <main className="px-6 md:px-10 py-6 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: dur.sm, ease: ease.outExpo }}
            >
              {page === 'dashboard' && <DashboardPage />}
              {page === 'bookings' && <BookingsTable />}
              {page === 'clients' && <ClientsPage />}
              {page === 'calendar' && <CalendarPage />}
              {page === 'revenue' && <RevenuePage />}
              {page === 'services' && <ServicesPage />}
              {page === 'team' && <TeamPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Default export — the route entry point.
 * ───────────────────────────────────────────────────────────────────────── */

export function Admin() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    document.body.dataset.theme = 'dark';
    document.title = 'Malonic CRM · Admin';
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!unlocked ? (
        <motion.div
          key="access"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: dur.sm, ease: ease.outExpo } }}
        >
          <AccessScreen onUnlock={() => setUnlocked(true)} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.md, ease: ease.outExpo }}
        >
          <AdminDashboard onLock={() => setUnlocked(false)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Admin;
