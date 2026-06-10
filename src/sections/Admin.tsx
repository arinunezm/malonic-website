/**
 * Malonic Records · /admin — CRM shell.
 *
 * Flujo: sin usuarios → SetupCard (crear admin) · con usuarios → LoginCard
 * (3D tilt + flip al validar) · sesión → AdminShell con sidebar/topbar/
 * mobile-nav y el router de páginas. Toda la data vive en admin-store
 * (localStorage, empieza vacía) vía AdminProvider.
 */

import React, { useEffect, useState, type FormEvent } from 'react';
import { animate, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ease, dur } from '../lib/motion';
import { Wordmark } from '../components/Nav';
import { loadStore, todayISO, formatDateLongMX } from '../lib/admin-store';
import { AdminProvider, useAdmin, PAGE_TITLES, type PageId } from './admin/AdminContext';
import {
  PageSkeleton,
  Toast,
  IconArrowLeft,
  IconBookings,
  IconCalendar,
  IconChart,
  IconDashboard,
  IconDatabase,
  IconInbox,
  IconLock,
  IconLogout,
  IconPen,
  IconPlus,
  IconSearch,
  IconSettings,
  IconUsers,
  type IconProps,
} from './admin/AdminUI';
import { DashboardPage, AnalyticsPage } from './admin/AdminInsights';
import { BookingsPage, CalendarPage, RequestsPage, BookingModal } from './admin/AdminOperations';
import { ClientsPage, ServicesPage } from './admin/AdminCatalog';
import { BlogPage } from './admin/AdminContent';
import { UsersPage, DataPage } from './admin/AdminSystem';

const ACCESS_BG = '/img/studio-controlroom-purple.jpg';

/* ─────────────────────────────────────────────────────────────────────────
 * AccessCard3D — tilt + flip. mode 'login' valida credenciales; mode 'setup'
 * crea la cuenta admin inicial. El flip solo ocurre con acceso válido.
 * ───────────────────────────────────────────────────────────────────────── */

function AccessCard3D({
  mode,
  onLogin,
  onSetup,
}: {
  mode: 'login' | 'setup';
  onLogin: (username: string, password: string) => Promise<boolean>;
  onSetup: (name: string, username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flipY = useMotionValue(0);
  const shakeX = useMotionValue(0);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const tiltXSpring = useSpring(tiltX, { stiffness: 160, damping: 22, mass: 0.5 });
  const tiltYSpring = useSpring(tiltY, { stiffness: 160, damping: 22, mass: 0.5 });
  const rotateY = useTransform([flipY, tiltYSpring], ([f, t]: number[]) => f + t);

  const sheenX = useMotionValue(50);
  const sheenY = useMotionValue(30);
  const sheen = useTransform(
    [sheenX, sheenY],
    ([x, y]: number[]) =>
      `radial-gradient(circle 60% at ${x}% ${y}%, rgba(245,243,238,0.10) 0%, rgba(245,243,238,0.02) 35%, rgba(10,10,10,0) 75%)`,
  );

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

  const fail = (msg: string) => {
    setError(msg);
    setSubmitting(false);
    animate(shakeX, [0, -10, 10, -7, 7, -3, 0], { duration: 0.45, ease: 'easeOut' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    tiltX.set(0);
    tiltY.set(0);

    if (mode === 'setup') {
      if (name.trim().length < 2) return fail('Escribe tu nombre.');
      if (username.trim().length < 3) return fail('Usuario de al menos 3 caracteres.');
      if (password.length < 6) return fail('Contraseña de al menos 6 caracteres.');
      if (password !== confirm) return fail('Las contraseñas no coinciden.');
      await onSetup(name, username, password);
      animate(flipY, 180, { duration: 0.9, ease: ease.reveal });
      return;
    }

    const ok = await onLogin(username, password);
    if (!ok) return fail('Usuario o contraseña incorrectos.');
    animate(flipY, 180, { duration: 0.9, ease: ease.reveal });
  };

  const inputStyle: React.CSSProperties = { color: 'var(--color-paper)' };
  const fieldStyle: React.CSSProperties = {
    borderColor: 'color-mix(in srgb, var(--color-paper) 22%, transparent)',
    color: 'var(--color-pearl)',
  };

  return (
    <div className="relative w-full max-w-[540px] mx-auto perspective-1200">
      <motion.div
        className="relative preserve-3d"
        style={{
          width: '100%',
          aspectRatio: mode === 'setup' ? '4 / 5.6' : '5 / 7',
          maxHeight: '82vh',
          rotateX: tiltXSpring,
          rotateY,
          x: shakeX,
        }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: dur.lg, ease: ease.outExpo, delay: 0.1 }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 backface-hidden rounded-[20px] overflow-hidden glow-signal-soft"
          style={{
            background:
              'linear-gradient(160deg, color-mix(in srgb, var(--color-smoke) 96%, transparent) 0%, color-mix(in srgb, var(--color-ink) 92%, transparent) 100%)',
            border: '1px solid color-mix(in srgb, var(--color-paper) 8%, transparent)',
          }}
          data-cursor="hover"
        >
          <motion.div className="absolute inset-0 pointer-events-none" style={{ background: sheen }} />
          <span className="scanline" aria-hidden />
          <div className="absolute top-5 right-5 flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: 'var(--color-cloud)' }}>
            <span className="live-dot" /> Live · Estudio
          </div>

          <div className="relative h-full p-7 md:p-10 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-5">
              <Wordmark size="sm" />
              <span className="label" style={{ color: 'var(--color-cloud)' }}>
                {mode === 'setup' ? 'Primer arranque · CRM' : 'Admin Access · CRM'}
              </span>
              <h2 className="font-display text-[clamp(1.7rem,4vw,2.6rem)] leading-[0.95]" style={{ letterSpacing: '-0.025em', color: 'var(--color-paper)' }}>
                {mode === 'setup' ? (
                  <>Configura tu <span className="italic-emphasis">acceso.</span></>
                ) : (
                  <>Sala de <span className="italic-emphasis">control.</span></>
                )}
              </h2>
              {mode === 'setup' && (
                <p className="text-[0.88rem] max-w-[40ch]" style={{ color: 'var(--color-cloud)' }}>
                  Crea la cuenta de administrador del estudio. Después podrás dar acceso al resto del equipo.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'setup' && (
                <div className="field" style={fieldStyle}>
                  <label htmlFor="admin-name" style={{ color: 'var(--color-cloud)' }}>Tu nombre</label>
                  <input id="admin-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} style={inputStyle} />
                </div>
              )}
              <div className="field" style={fieldStyle}>
                <label htmlFor="admin-user" style={{ color: 'var(--color-cloud)' }}>Usuario</label>
                <input id="admin-user" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={submitting} style={inputStyle} />
              </div>
              <div className="field" style={fieldStyle}>
                <label htmlFor="admin-pass" style={{ color: 'var(--color-cloud)' }}>Contraseña</label>
                <input id="admin-pass" type="password" autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting} style={inputStyle} />
              </div>
              {mode === 'setup' && (
                <div className="field" style={fieldStyle}>
                  <label htmlFor="admin-confirm" style={{ color: 'var(--color-cloud)' }}>Confirmar contraseña</label>
                  <input id="admin-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={submitting} style={inputStyle} />
                </div>
              )}

              {error && (
                <p role="alert" className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: 'color-mix(in srgb, var(--color-brass) 90%, var(--color-paper))' }}>
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-4 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative inline-flex items-center gap-3 px-5 py-3 rounded-full transition-all disabled:opacity-60"
                  style={{ background: 'var(--color-signal)', color: 'var(--color-ink)', boxShadow: '0 12px 36px -14px rgba(0,198,41,0.55)' }}
                  data-cursor="signal"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] font-medium">
                    {submitting ? 'Verificando…' : mode === 'setup' ? 'Crear cuenta' : 'Acceder'}
                  </span>
                  <IconLock width={14} height={14} strokeWidth={1.8} />
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-right" style={{ color: 'var(--color-mist)' }}>
                  {mode === 'setup' ? 'Solo la primera vez' : 'Acceso del equipo'}
                </span>
              </div>
            </form>

            <div className="flex items-center justify-between pt-5" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-paper) 8%, transparent)' }}>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>SVC-057 · CRM</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>MTY · MX</span>
            </div>
          </div>
        </div>

        {/* BACK */}
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
              <IconLock width={26} height={26} strokeWidth={2} />
            </motion.div>
            <div className="space-y-3">
              <span className="label" style={{ color: 'var(--color-signal)' }}>Acceso concedido</span>
              <h3 className="font-display text-[clamp(1.8rem,4vw,2.6rem)]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.022em' }}>
                Bienvenido al <span className="italic-emphasis">estudio.</span>
              </h3>
              <p className="text-[0.9rem]" style={{ color: 'var(--color-cloud)' }}>Cargando panel de control…</p>
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

function AccessScreen({
  mode,
  onLogin,
  onSetup,
}: {
  mode: 'login' | 'setup';
  onLogin: (u: string, p: string) => Promise<boolean>;
  onSetup: (n: string, u: string, p: string) => Promise<void>;
}) {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <img src={ACCESS_BG} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(28px) brightness(0.42) saturate(1.05)', transform: 'scale(1.12)' }} />
      <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.78) 50%, rgba(10,10,10,0.96) 100%)' }} />
      <div aria-hidden className="absolute inset-0 bg-hairline-grid opacity-40" />

      <div className="absolute top-0 left-0 right-0 z-10 container-x h-[72px] flex items-center justify-between">
        <a href="/" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] opacity-70 hover:opacity-100 transition-opacity" data-cursor="hover">
          <IconArrowLeft width={14} height={14} />
          Regresar al sitio
        </a>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">malonicrecords.com / admin</span>
      </div>

      <div className="relative z-10 w-full container-x py-[9vh]">
        <AccessCard3D mode={mode} onLogin={onLogin} onSetup={onSetup} />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Sidebar / Topbar / MobileNav
 * ───────────────────────────────────────────────────────────────────────── */

type NavItem = { id: PageId; label: string; Icon: (p: IconProps) => React.JSX.Element };

const MAIN_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard',     Icon: IconDashboard },
  { id: 'requests',  label: 'Solicitudes',   Icon: IconInbox },
  { id: 'bookings',  label: 'Reservaciones', Icon: IconBookings },
  { id: 'calendar',  label: 'Calendario',    Icon: IconCalendar },
  { id: 'clients',   label: 'Clientes',      Icon: IconUsers },
  { id: 'blog',      label: 'Blog',          Icon: IconPen },
  { id: 'analytics', label: 'Analítica',     Icon: IconChart },
];

const CONFIG_NAV: NavItem[] = [
  { id: 'services', label: 'Servicios', Icon: IconSettings },
  { id: 'users',    label: 'Usuarios',  Icon: IconUsers },
  { id: 'data',     label: 'Datos',     Icon: IconDatabase },
];

function SidebarButton({ item, active, badge, onClick }: { item: NavItem; active: boolean; badge?: number; onClick: () => void }) {
  const { Icon, label } = item;
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor="hover"
      className="group relative flex items-center gap-3 w-full text-left px-6 py-2.5 transition-colors"
      style={{
        color: active ? 'var(--color-paper)' : 'var(--color-cloud)',
        background: active ? 'color-mix(in srgb, var(--color-signal) 8%, transparent)' : 'transparent',
      }}
    >
      <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-[2px] transition-opacity" style={{ background: 'var(--color-signal)', opacity: active ? 1 : 0 }} />
      <Icon width={16} height={16} />
      <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{label}</span>
      {badge ? (
        <span className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-signal)', color: 'var(--color-ink)', fontWeight: 600 }}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function AdminSidebar() {
  const { page, setPage, logout, store, currentUser } = useAdmin();
  const pendingBookings = store.bookings.filter((b) => b.status === 'pending').length;
  const newRequests = store.requests.filter((r) => r.status === 'new').length;
  const badges: Partial<Record<PageId, number>> = { bookings: pendingBookings || undefined, requests: newRequests || undefined };

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
        {MAIN_NAV.map((item) => (
          <SidebarButton key={item.id} item={item} active={page === item.id} badge={badges[item.id]} onClick={() => setPage(item.id)} />
        ))}
        <div className="px-6 pt-6 pb-2 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--color-mist)' }}>Configuración</div>
        {CONFIG_NAV.map((item) => (
          <SidebarButton key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />
        ))}
      </nav>

      <div className="px-6 py-4 flex items-center gap-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-paper) 6%, transparent)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-[11px] font-medium" style={{ background: 'color-mix(in srgb, var(--color-signal) 86%, var(--color-ink))', color: 'var(--color-ink)' }}>
          {(currentUser?.name ?? 'M R').split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[0.82rem] truncate" style={{ color: 'var(--color-paper)' }}>{currentUser?.name ?? 'Malonic Records'}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-mist)' }}>
            {currentUser?.role === 'admin' ? 'Administrador' : 'Staff'}
          </div>
        </div>
        <button type="button" onClick={logout} className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-60 hover:opacity-100 transition-opacity" data-cursor="hover" aria-label="Cerrar sesión" title="Cerrar sesión">
          Salir
        </button>
      </div>
    </aside>
  );
}

const SEARCH_PAGES: PageId[] = ['dashboard', 'bookings', 'clients', 'requests'];

function Topbar() {
  const { page, query, setQuery, openBookingModal } = useAdmin();
  const searchable = SEARCH_PAGES.includes(page);
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 md:px-10 h-[72px]"
      style={{
        background: 'color-mix(in srgb, var(--color-ink) 78%, transparent)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)',
      }}
    >
      <div className="flex items-baseline gap-4 min-w-0">
        <h1 className="font-display text-[1.25rem] md:text-[1.4rem] truncate" style={{ color: 'var(--color-paper)', letterSpacing: '-0.018em' }}>
          {PAGE_TITLES[page]}
        </h1>
        <span className="hidden lg:inline-flex font-mono text-[10px] uppercase tracking-[0.22em] whitespace-nowrap" style={{ color: 'var(--color-mist)' }}>
          {formatDateLongMX(todayISO())}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {searchable && (
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full w-[200px] md:w-[250px]"
            style={{ background: 'color-mix(in srgb, var(--color-paper) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--color-paper) 8%, transparent)' }}
          >
            <IconSearch width={14} height={14} style={{ color: 'var(--color-cloud)', flexShrink: 0 }} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              aria-label="Buscar en el CRM"
              className="bg-transparent outline-none border-0 text-[0.85rem] w-full"
              style={{ color: 'var(--color-paper)' }}
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Limpiar búsqueda" data-cursor="hover" className="font-mono text-[11px] leading-none px-1 opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-paper)' }}>
                ✕
              </button>
            ) : null}
          </div>
        )}
        <button
          type="button"
          onClick={() => openBookingModal()}
          aria-label="Nueva reserva"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ background: 'var(--color-signal)', color: 'var(--color-ink)' }}
          data-cursor="signal"
        >
          <IconPlus width={14} height={14} />
          <span className="hidden sm:inline">Nueva reserva</span>
        </button>
      </div>
    </header>
  );
}

function MobileNav() {
  const { page, setPage, logout, store } = useAdmin();
  const [moreOpen, setMoreOpen] = useState(false);
  const newRequests = store.requests.filter((r) => r.status === 'new').length;

  const tabs: NavItem[] = [
    { id: 'dashboard', label: 'Panel',       Icon: IconDashboard },
    { id: 'bookings',  label: 'Reservas',    Icon: IconBookings },
    { id: 'calendar',  label: 'Agenda',      Icon: IconCalendar },
    { id: 'requests',  label: 'Solicitudes', Icon: IconInbox },
  ];
  const moreItems: NavItem[] = [
    { id: 'clients',   label: 'Clientes',            Icon: IconUsers },
    { id: 'blog',      label: 'Blog',                Icon: IconPen },
    { id: 'analytics', label: 'Analítica',           Icon: IconChart },
    { id: 'services',  label: 'Servicios & tarifas', Icon: IconSettings },
    { id: 'users',     label: 'Usuarios',            Icon: IconUsers },
    { id: 'data',      label: 'Datos & respaldo',    Icon: IconDatabase },
  ];
  const moreActive = moreItems.some((m) => m.id === page);
  const go = (id: PageId) => {
    setPage(id);
    setMoreOpen(false);
  };

  return (
    <>
      {moreOpen && (
        <motion.div
          key="more-backdrop"
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(10,10,10,0.55)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: dur.xs }}
          onClick={() => setMoreOpen(false)}
        />
      )}
      {moreOpen && (
          <motion.div
            key="more-sheet"
            className="fixed left-3 right-3 z-50 md:hidden rounded-[16px] overflow-hidden"
            style={{
              bottom: 'calc(76px + env(safe-area-inset-bottom))',
              background: 'color-mix(in srgb, var(--color-smoke) 97%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-paper) 8%, transparent)',
              boxShadow: '0 24px 60px -24px rgba(0,0,0,0.7)',
            }}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: dur.xs, ease: ease.outExpo }}
            role="menu"
            aria-label="Más secciones"
          >
            {moreItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                role="menuitem"
                className="flex items-center gap-3 w-full px-5 py-3.5 text-left"
                style={{ color: page === id ? 'var(--color-signal)' : 'var(--color-paper)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 6%, transparent)' }}
              >
                <Icon width={16} height={16} style={{ color: page === id ? 'var(--color-signal)' : 'var(--color-cloud)' }} />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                logout();
              }}
              role="menuitem"
              className="flex items-center gap-3 w-full px-5 py-3.5 text-left"
              style={{ color: 'var(--color-cloud)' }}
            >
              <IconLogout width={16} height={16} />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em]">Cerrar sesión</span>
            </button>
          </motion.div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        aria-label="Navegación del panel"
        style={{
          background: 'color-mix(in srgb, var(--color-ink) 88%, transparent)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderTop: '1px solid color-mix(in srgb, var(--color-paper) 7%, transparent)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="grid grid-cols-5">
          {tabs.map(({ id, label, Icon }) => {
            const active = page === id && !moreOpen;
            return (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center gap-1 py-2.5 transition-colors"
                style={{ color: active ? 'var(--color-signal)' : 'var(--color-cloud)' }}
              >
                <span className="relative">
                  <Icon width={17} height={17} />
                  {id === 'requests' && newRequests > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--color-signal)' }} />
                  )}
                </span>
                <span className="font-mono text-[8.5px] uppercase tracking-[0.1em]">{label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className="flex flex-col items-center gap-1 py-2.5 transition-colors"
            style={{ color: moreOpen || moreActive ? 'var(--color-signal)' : 'var(--color-cloud)' }}
          >
            <IconSettings width={17} height={17} />
            <span className="font-mono text-[8.5px] uppercase tracking-[0.1em]">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Shell + router
 * ───────────────────────────────────────────────────────────────────────── */

function AdminShell() {
  const { page, loading, toast } = useAdmin();
  return (
    <div className="relative min-h-screen w-full" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <div aria-hidden className="absolute inset-0 bg-hairline-grid opacity-30 pointer-events-none" />
      <AdminSidebar />
      <div className="md:ml-[252px] relative">
        <Topbar />
        <main className="px-5 md:px-10 py-6 md:py-8 pb-28 md:pb-10">
          {/* Keyed remount per page → entry fade. No AnimatePresence exit:
              full-tree swaps stalled onExitComplete under provider re-renders. */}
          <motion.div
            key={loading ? 'skeleton' : page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur.sm, ease: ease.outExpo }}
          >
            {loading ? (
              <PageSkeleton />
            ) : (
              <>
                {page === 'dashboard' && <DashboardPage />}
                {page === 'requests' && <RequestsPage />}
                {page === 'bookings' && <BookingsPage />}
                {page === 'calendar' && <CalendarPage />}
                {page === 'clients' && <ClientsPage />}
                {page === 'blog' && <BlogPage />}
                {page === 'analytics' && <AnalyticsPage />}
                {page === 'services' && <ServicesPage />}
                {page === 'users' && <UsersPage />}
                {page === 'data' && <DataPage />}
              </>
            )}
          </motion.div>
        </main>
      </div>
      <MobileNav />
      <BookingModal />
      <Toast message={toast} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Entry — gates: setup (sin usuarios) → login → shell
 * ───────────────────────────────────────────────────────────────────────── */

// On a fresh page load with a live session (refresh), skip the card entirely.
let restoredAtBoot: string | null | undefined;
function sessionRestored(userId: string): boolean {
  if (restoredAtBoot === undefined) {
    try {
      restoredAtBoot = window.sessionStorage.getItem('malonic-admin-session');
    } catch {
      restoredAtBoot = null;
    }
  }
  return restoredAtBoot === userId;
}

function AdminGate() {
  const { currentUser, store, login, setupAdmin } = useAdmin();
  const mode: 'login' | 'setup' = store.users.length === 0 ? 'setup' : 'login';
  const [entered, setEntered] = useState(false);

  // El flip de la card dura ~1.5s antes de entrar al shell.
  const handleLogin = async (u: string, p: string) => {
    const ok = await login(u, p);
    if (ok) window.setTimeout(() => setEntered(true), 1500);
    return ok;
  };
  const handleSetup = async (n: string, u: string, p: string) => {
    await setupAdmin(n, u, p);
    window.setTimeout(() => setEntered(true), 1500);
  };

  const showShell = currentUser !== null && (entered || sessionRestored(currentUser.id));

  // Conditional render (no AnimatePresence here): swapping two full-screen
  // trees via exit animations proved fragile — the card's live motion values
  // can stall onExitComplete and the shell never mounts. Entry-only motion.
  return showShell ? (
    <motion.div key="shell" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <AdminShell />
    </motion.div>
  ) : (
    <motion.div key="access" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: dur.sm, ease: ease.outExpo }}>
      <AccessScreen mode={mode} onLogin={handleLogin} onSetup={handleSetup} />
    </motion.div>
  );
}

export function Admin() {
  const [, setLockTick] = useState(0);

  useEffect(() => {
    document.body.dataset.theme = 'dark';
    document.title = 'Malonic CRM · Admin';
    loadStore();
  }, []);

  return (
    <AdminProvider
      onLocked={() => {
        restoredAtBoot = null;
        setLockTick((t) => t + 1);
      }}
    >
      <AdminGate />
    </AdminProvider>
  );
}

export default Admin;
