/**
 * Panel general + Analítica — todos los números salen de los datos reales
 * capturados (cero mock). Con la base vacía, los módulos guían a la acción.
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ease, dur } from '../../lib/motion';
import { useAdmin } from './AdminContext';
import { BookingsPage } from './AdminOperations';
import {
  CARD_STYLE,
  Donut,
  EmptyState,
  FunnelRow,
  GhostButton,
  HAIRLINE,
  HBarList,
  KpiTile,
  SignalButton,
  VBarChart,
  IconAlert,
  IconBookings,
  IconCalendar,
  IconChart,
  IconClock,
  IconHeadphones,
  IconInbox,
  IconPen,
  IconPlus,
  IconRevenue,
  IconUsers,
} from './AdminUI';
import {
  avgTicketOf,
  formatMXN,
  hoursByRoomOf,
  monthRevenueOf,
  monthlyRevenueOf,
  receivablesOf,
  relativeTime,
  revenueByServiceOf,
  statusCountsOf,
  topClientsOf,
  totalOverdueOf,
  totalReceivableOf,
  weekDaysFor,
  weekHoursOf,
} from '../../lib/admin-store';

const toneColor = {
  signal: 'var(--color-signal)',
  brass: 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))',
  pearl: 'var(--color-pearl)',
  paper: 'var(--color-paper)',
} as const;

/* ─────────────────────────────────────────────────────────────────────────
 * DASHBOARD
 * ───────────────────────────────────────────────────────────────────────── */

export function DashboardPage() {
  const { store, openBookingModal, setPage } = useAdmin();
  const days = useMemo(() => weekDaysFor(0), []);

  const weekBookings = store.bookings.filter((b) => b.status !== 'cancelled' && days.some((d) => d.key === b.date));
  const monthRevenue = monthRevenueOf(store.bookings);
  const receivable = totalReceivableOf(store.bookings);
  const overdue = totalOverdueOf(store.bookings);
  const newRequests = store.requests.filter((r) => r.status === 'new');
  const weekHours = weekHoursOf(store.bookings, days);
  const totalWeekHours = weekHours.reduce((a, d) => a + d.hours, 0);

  const isEmpty = store.bookings.length === 0 && store.requests.length === 0 && store.clients.length === 0;

  return (
    <>
      {/* KPI row */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <KpiTile Icon={IconCalendar} value={String(weekBookings.length)} label="Sesiones esta semana" meta={`${totalWeekHours}h agendadas`} index={0} />
        <KpiTile Icon={IconRevenue} value={`$${formatMXN(monthRevenue)}`} label="Facturación del mes (MXN)" index={1} />
        <KpiTile Icon={IconAlert} value={`$${formatMXN(receivable)}`} label="Por cobrar" meta={overdue > 0 ? `$${formatMXN(overdue)} vencido` : undefined} tone="brass" index={2} />
        <KpiTile Icon={IconInbox} value={String(newRequests.length)} label="Solicitudes nuevas" meta={newRequests.length > 0 ? 'Revisar bandeja' : undefined} tone="pearl" index={3} />
      </div>

      {isEmpty ? (
        <EmptyState
          Icon={IconChart}
          title="Tu estudio, en limpio"
          body="El CRM arranca vacío: carga tu catálogo de servicios, agrega clientes y crea la primera reservación. Cada dato que captures alimenta el calendario, los ingresos y la analítica."
          action={
            <>
              <SignalButton onClick={() => setPage('services')}>Configurar servicios</SignalButton>
              <GhostButton onClick={() => openBookingModal()}>
                <IconPlus width={12} height={12} /> Primera reserva
              </GhostButton>
            </>
          }
        />
      ) : (
        <>
          {/* Week hours + requests inbox */}
          <div className="grid gap-6 mb-6 [grid-template-columns:1fr] lg:[grid-template-columns:1.4fr_1fr]">
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.md, ease: ease.outExpo, delay: 0.12 }}
              className="rounded-[14px] p-6"
              style={CARD_STYLE}
            >
              <div className="flex items-end justify-between mb-6">
                <div>
                  <span className="label" style={{ color: 'var(--color-cloud)' }}>Horas de estudio</span>
                  <h3 className="mt-1 font-display text-[1.2rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.018em' }}>Semana en curso</h3>
                </div>
                <div className="text-right">
                  <div className="font-display text-[1.4rem]" style={{ color: 'var(--color-paper)' }}>{totalWeekHours}h</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-mist)' }}>Total</div>
                </div>
              </div>
              <VBarChart data={weekHours.map((w) => ({ label: w.day, value: w.hours }))} format={(v) => `${v}h`} />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.md, ease: ease.outExpo, delay: 0.16 }}
              className="rounded-[14px] overflow-hidden flex flex-col"
              style={CARD_STYLE}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: HAIRLINE }}>
                <h3 className="font-display text-[1.05rem]" style={{ color: 'var(--color-paper)' }}>Bandeja de solicitudes</h3>
                <button type="button" onClick={() => setPage('requests')} data-cursor="hover" className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-70 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-signal)' }}>
                  Ver todas →
                </button>
              </div>
              {newRequests.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                  <IconInbox width={18} height={18} style={{ color: 'var(--color-mist)' }} />
                  <p className="text-[0.82rem]" style={{ color: 'var(--color-cloud)' }}>Bandeja limpia — sin solicitudes nuevas.</p>
                </div>
              ) : (
                <ul className="flex-1">
                  {newRequests.slice(0, 4).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' }}>
                      <div className="min-w-0">
                        <div className="text-[0.85rem] truncate" style={{ color: 'var(--color-paper)' }}>{r.name}</div>
                        <div className="text-[0.72rem] truncate" style={{ color: 'var(--color-mist)' }}>{r.service ?? 'Sin servicio'} · {relativeTime(r.createdAt)}</div>
                      </div>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-signal)' }} />
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          </div>

          {/* Upcoming bookings + activity */}
          <div className="grid gap-6 [grid-template-columns:1fr] xl:[grid-template-columns:1fr_380px]">
            <BookingsPage embedded />
            <ActivityFeed />
          </div>
        </>
      )}
    </>
  );
}

function ActivityFeed() {
  const { store, openBookingModal, setPage } = useAdmin();
  const quickActions: { label: string; run: () => void }[] = [
    { label: 'Nueva reserva', run: () => openBookingModal() },
    { label: 'Nueva entrada de blog', run: () => setPage('blog') },
    { label: 'Agregar cliente', run: () => setPage('clients') },
    { label: 'Ver analítica', run: () => setPage('analytics') },
  ];
  const shown = store.activities.slice(0, 7);
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.md, ease: ease.outExpo, delay: 0.2 }}
      className="rounded-[14px] overflow-hidden flex flex-col"
      style={CARD_STYLE}
    >
      <div className="px-5 py-4" style={{ borderBottom: HAIRLINE }}>
        <h3 className="font-display text-[1.05rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.012em' }}>Actividad reciente</h3>
      </div>
      {shown.length === 0 ? (
        <div className="px-5 py-10 text-center text-[0.82rem]" style={{ color: 'var(--color-cloud)' }}>
          Aquí verás el historial de cambios del CRM.
        </div>
      ) : (
        <ul className="px-5 py-3 flex-1">
          {shown.map((a, i) => (
            <li key={a.id} className="flex gap-3 py-3">
              <div className="flex flex-col items-center pt-[6px]">
                <span className="w-2 h-2 rounded-full" style={{ background: toneColor[a.tone] }} />
                {i < shown.length - 1 && <span className="flex-1 w-px mt-1" style={{ background: 'color-mix(in srgb, var(--color-paper) 5%, transparent)' }} />}
              </div>
              <div className="min-w-0 pb-1">
                <div className="text-[0.85rem]" style={{ color: 'var(--color-cloud)' }}>
                  {a.actor ? <><strong style={{ color: 'var(--color-paper)', fontWeight: 600 }}>{a.actor}</strong>{' '}</> : null}
                  {a.text}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] mt-0.5" style={{ color: 'var(--color-mist)' }}>{relativeTime(a.at)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2 px-5 py-4" style={{ borderTop: HAIRLINE }}>
        {quickActions.map(({ label, run }) => (
          <button
            key={label}
            type="button"
            onClick={run}
            data-cursor="hover"
            className="px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-[0.16em] transition-all hover:opacity-80"
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

/* ─────────────────────────────────────────────────────────────────────────
 * ANALÍTICA
 * ───────────────────────────────────────────────────────────────────────── */

function ChartCard({ title, sub, children, delay = 0 }: { title: string; sub?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.md, ease: ease.outExpo, delay }}
      className="rounded-[14px] p-6"
      style={CARD_STYLE}
    >
      <div className="flex items-baseline justify-between mb-6 gap-3">
        <h3 className="font-display text-[1.05rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.012em' }}>{title}</h3>
        {sub ? <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-right" style={{ color: 'var(--color-mist)' }}>{sub}</span> : null}
      </div>
      {children}
    </motion.section>
  );
}

export function AnalyticsPage() {
  const { store, openBookingModal } = useAdmin();
  const bookings = store.bookings;

  const monthly = useMemo(() => monthlyRevenueOf(bookings, 6), [bookings]);
  const byService = useMemo(() => revenueByServiceOf(bookings), [bookings]);
  const byRoom = useMemo(() => hoursByRoomOf(bookings), [bookings]);
  const counts = useMemo(() => statusCountsOf(bookings), [bookings]);
  const top = useMemo(() => topClientsOf(bookings, 5), [bookings]);
  const receivables = useMemo(() => receivablesOf(bookings), [bookings]);

  const monthRevenue = monthRevenueOf(bookings);
  const avgTicket = avgTicketOf(bookings);
  const totalHours = byRoom.reduce((a, r) => a + r.hours, 0);
  const requestsTotal = store.requests.length;
  const converted = store.requests.filter((r) => r.status === 'converted').length;
  const conversion = requestsTotal > 0 ? Math.round((converted / requestsTotal) * 100) : null;

  const paid = bookings.filter((b) => b.paymentStatus === 'paid' && b.status !== 'cancelled').reduce((a, b) => a + b.amount, 0);
  const deposits = bookings.filter((b) => b.paymentStatus === 'deposit').reduce((a, b) => a + b.deposit, 0);
  const pendingPay = bookings.filter((b) => (b.paymentStatus === 'pending' || b.paymentStatus === 'deposit') && b.status !== 'cancelled').reduce((a, b) => a + (b.amount - b.deposit), 0);
  const overdue = totalOverdueOf(bookings);

  if (bookings.length === 0) {
    return (
      <EmptyState
        Icon={IconChart}
        title="La analítica se construye sola"
        body="En cuanto registres reservaciones verás facturación por mes, ingresos por servicio, ocupación por sala, conversión de solicitudes y tus mejores clientes — todo calculado en vivo."
        action={
          <SignalButton onClick={() => openBookingModal()}>
            <IconPlus width={13} height={13} /> Crear primera reserva
          </SignalButton>
        }
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      {/* KPI row */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <KpiTile Icon={IconRevenue} value={`$${formatMXN(monthRevenue)}`} label="Facturación del mes" index={0} />
        <KpiTile Icon={IconClock} value={`${totalHours}h`} label="Horas reservadas (histórico)" index={1} />
        <KpiTile Icon={IconBookings} value={`$${formatMXN(avgTicket)}`} label="Ticket promedio" tone="pearl" index={2} />
        <KpiTile Icon={IconUsers} value={conversion === null ? '—' : `${conversion}%`} label="Conversión de solicitudes" meta={requestsTotal > 0 ? `${converted}/${requestsTotal} convertidas` : 'Sin solicitudes aún'} tone="brass" index={3} />
      </div>

      <div className="grid gap-6 mb-6 [grid-template-columns:1fr] lg:[grid-template-columns:1.4fr_1fr]">
        <ChartCard title="Facturación · últimos 6 meses" sub="Confirmadas + completadas" delay={0.08}>
          <VBarChart data={monthly.map((m) => ({ label: m.month, value: m.revenue }))} height={190} />
        </ChartCard>
        <ChartCard title="Ocupación por sala" sub={`${totalHours}h totales`} delay={0.12}>
          <Donut
            data={byRoom.map((r) => ({ label: r.room.name, value: r.hours }))}
            centerLabel="Horas"
            centerValue={`${totalHours}h`}
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 mb-6 [grid-template-columns:1fr] lg:[grid-template-columns:1fr_1fr]">
        <ChartCard title="Ingresos por servicio" delay={0.16}>
          {byService.length === 0 ? (
            <p className="text-[0.85rem]" style={{ color: 'var(--color-cloud)' }}>Confirma una reserva para ver este desglose.</p>
          ) : (
            <HBarList data={byService.map((s) => ({ label: s.name, value: s.revenue, accent: s.atmos }))} />
          )}
        </ChartCard>
        <ChartCard title="Embudo de reservaciones" sub={`${bookings.length} totales`} delay={0.2}>
          <FunnelRow
            steps={[
              { label: 'Solicitudes', value: requestsTotal },
              { label: 'Pendientes', value: counts.pending },
              { label: 'Confirmadas', value: counts.confirmed },
              { label: 'Completadas', value: counts.completed },
            ]}
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 [grid-template-columns:1fr] lg:[grid-template-columns:1fr_1fr]">
        <ChartCard title="Top clientes" sub="Por facturación" delay={0.24}>
          {top.length === 0 ? (
            <p className="text-[0.85rem]" style={{ color: 'var(--color-cloud)' }}>Aún sin clientes con reservas.</p>
          ) : (
            <HBarList data={top.map((c) => ({ label: `${c.name} · ${c.sessions} ses.`, value: c.revenue, accent: true }))} />
          )}
        </ChartCard>
        <ChartCard title="Cobranza" sub={receivables.length > 0 ? `${receivables.length} cuentas abiertas` : 'Todo liquidado'} delay={0.28}>
          <HBarList
            data={[
              { label: 'Pagado', value: paid, accent: true },
              { label: 'Depósitos retenidos', value: deposits },
              { label: 'Por cobrar', value: pendingPay },
              { label: 'Vencido', value: overdue },
            ]}
          />
        </ChartCard>
      </div>
    </motion.div>
  );
}
