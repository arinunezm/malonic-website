/**
 * Operación diaria: solicitudes web → reservaciones → calendario.
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ease, dur } from '../../lib/motion';
import { useAdmin, type BookingDraft } from './AdminContext';
import {
  Avatar,
  CARD_STYLE,
  ConfirmDialog,
  EmptyState,
  Field,
  GhostButton,
  HAIRLINE,
  ModalShell,
  PaymentPill,
  RequestPill,
  ResultCount,
  SignalButton,
  StatusPill,
  fieldInputStyle,
  ACCENT_SOFT,
  ACCENT_FG,
  IconBookings,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconInbox,
  IconPlus,
  IconSearch,
  IconTrash,
} from './AdminUI';
import {
  CAL_END_HOUR,
  CAL_START_HOUR,
  ROOMS,
  ROOM_BY_ID,
  formatDateMX,
  formatMXN,
  parseHour,
  relativeTime,
  todayISO,
  weekDaysFor,
  weekLabelFor,
  type Booking,
  type BookingStatus,
} from '../../lib/admin-store';

const matches = (q: string, ...fields: (string | undefined)[]) =>
  fields.some((f) => f?.toLowerCase().includes(q));

/* ─────────────────────────────────────────────────────────────────────────
 * SOLICITUDES — inbox del formulario público
 * ───────────────────────────────────────────────────────────────────────── */

export function RequestsPage() {
  const { store, setRequestStatus, openBookingModal, query, cloud } = useAdmin();
  const [tab, setTab] = useState<'open' | 'all'>('open');
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const base = tab === 'open' ? store.requests.filter((r) => r.status === 'new' || r.status === 'reviewed') : store.requests;
    return q ? base.filter((r) => matches(q, r.name, r.email, r.service, r.project, r.message)) : base;
  }, [store.requests, tab, q]);

  if (store.requests.length === 0) {
    return (
      <EmptyState
        Icon={IconInbox}
        title="Sin solicitudes todavía"
        body={
          cloud
            ? 'Cuando un visitante envíe el formulario de reservas del sitio web, su solicitud llegará aquí en automático para darle seguimiento y convertirla en reservación.'
            : 'Cuando alguien envíe el formulario de reservas del sitio web (en este navegador), aparecerá aquí para darle seguimiento y convertirla en reservación.'
        }
      />
    );
  }

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>
            {store.requests.filter((r) => r.status === 'new').length} nuevas
          </span>
          <ResultCount shown={filtered.length} total={tab === 'open' ? store.requests.filter((r) => r.status === 'new' || r.status === 'reviewed').length : store.requests.length} />
        </div>
        <div className="inline-flex p-[3px] rounded-full" style={{ background: 'color-mix(in srgb, var(--color-paper) 5%, transparent)' }}>
          {([['open', 'Abiertas'], ['all', 'Todas']] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              data-cursor="hover"
              className="px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.16em] transition-all"
              style={{
                background: tab === id ? 'color-mix(in srgb, var(--color-signal) 16%, transparent)' : 'transparent',
                color: tab === id ? 'var(--color-signal)' : 'var(--color-cloud)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState Icon={IconSearch} title="Sin resultados" body={q ? `Nada coincide con «${query.trim()}».` : 'No hay solicitudes abiertas — bandeja limpia.'} compact />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((r) => (
            <motion.article key={r.id} layout className="rounded-[14px] p-5" style={CARD_STYLE}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={r.name} accent="brass" size={40} />
                  <div className="min-w-0">
                    <div className="font-display text-[1.02rem] truncate" style={{ color: 'var(--color-paper)', letterSpacing: '-0.01em' }}>{r.name}</div>
                    <div className="text-[0.76rem] truncate" style={{ color: 'var(--color-mist)' }}>
                      {r.email}
                      {r.project ? ` · ${r.project}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-mist)' }}>{relativeTime(r.createdAt)}</span>
                  <RequestPill status={r.status} />
                </div>
              </div>
              {(r.service || r.message) && (
                <div className="pl-[52px] mb-4">
                  {r.service ? (
                    <span className="inline-flex mb-2 px-2.5 py-1 rounded-full font-mono text-[9px] uppercase tracking-[0.14em]" style={{ background: 'color-mix(in srgb, var(--color-paper) 5%, transparent)', color: 'var(--color-cloud)' }}>
                      {r.service}
                    </span>
                  ) : null}
                  {r.message ? (
                    <p className="text-[0.85rem] max-w-[72ch]" style={{ color: 'var(--color-cloud)' }}>{r.message}</p>
                  ) : null}
                </div>
              )}
              {(r.status === 'new' || r.status === 'reviewed') && (
                <div className="flex flex-wrap items-center gap-2 pl-[52px]">
                  <SignalButton
                    small
                    onClick={() =>
                      openBookingModal({
                        clientName: r.name,
                        project: r.project,
                        notes: [r.email, r.message].filter(Boolean).join(' · '),
                        requestId: r.id,
                        serviceId: store.services.find((s) => s.name.toLowerCase().includes((r.service ?? '').toLowerCase().split(' ')[0] || '∅'))?.id,
                      })
                    }
                  >
                    <IconBookings width={12} height={12} /> Convertir en reserva
                  </SignalButton>
                  {r.status === 'new' && (
                    <GhostButton small onClick={() => setRequestStatus(r.id, 'reviewed')}>
                      <IconCheck width={12} height={12} /> Marcar revisada
                    </GhostButton>
                  )}
                  <GhostButton small onClick={() => setRequestStatus(r.id, 'discarded')}>Descartar</GhostButton>
                  <a
                    href={`mailto:${r.email}`}
                    data-cursor="hover"
                    className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-60 hover:opacity-100 transition-opacity ml-1"
                    style={{ color: 'var(--color-paper)' }}
                  >
                    Responder ↗
                  </a>
                </div>
              )}
            </motion.article>
          ))}
        </div>
      )}
    </motion.section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * BOOKING MODAL — crear / editar / convertir solicitud
 * ───────────────────────────────────────────────────────────────────────── */

const HOUR_OPTIONS = Array.from({ length: CAL_END_HOUR - CAL_START_HOUR }, (_, i) => `${String(CAL_START_HOUR + i).padStart(2, '0')}:00`);

export function BookingModal() {
  const { bookingModal, closeBookingModal, saveBooking, store } = useAdmin();
  const open = bookingModal !== null;
  const d = bookingModal;

  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [project, setProject] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(4);
  const [deposit, setDeposit] = useState(0);
  const [notes, setNotes] = useState('');
  const [saveClient, setSaveClient] = useState(true);
  const [seeded, setSeeded] = useState<string | null>(null);

  // Seed form whenever a (different) draft opens.
  const draftKey = d ? `${d.id ?? 'new'}-${d.requestId ?? ''}-${d.clientName}` : null;
  if (open && d && seeded !== draftKey) {
    setSeeded(draftKey);
    setClientName(d.clientName ?? '');
    setClientId(d.clientId ?? '');
    setProject(d.project ?? '');
    setServiceId(d.serviceId ?? store.services.find((s) => s.active)?.id ?? '');
    setDate(d.date ?? todayISO());
    setTime(d.time ?? '10:00');
    setDuration(d.duration ?? 4);
    setDeposit(d.deposit ?? 0);
    setNotes(d.notes ?? '');
    setSaveClient(!d.clientId);
  }
  if (!open && seeded !== null) setSeeded(null);

  const activeServices = store.services.filter((s) => s.active || s.id === serviceId);
  const service = store.services.find((s) => s.id === serviceId);
  const amount = service ? (service.unit === 'hora' ? service.rate * duration : service.rate) : 0;
  const clamped = Math.max(0, Math.min(deposit, amount));
  const valid = clientName.trim().length > 1 && serviceId && date && time;

  const onPickClient = (id: string) => {
    setClientId(id);
    const c = store.clients.find((x) => x.id === id);
    if (c) setClientName(c.name);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !d) return;
    saveBooking({
      ...d,
      clientName,
      clientId: clientId || undefined,
      project,
      serviceId,
      date,
      time,
      duration,
      deposit: clamped,
      notes,
      saveClient: saveClient && !clientId,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={closeBookingModal}
      label={d?.requestId ? 'Convertir solicitud' : 'Reservaciones'}
      title={d?.id ? <>Editar <span className="italic-emphasis">reserva.</span></> : <>Nueva <span className="italic-emphasis">reserva.</span></>}
    >
      {store.services.length === 0 ? (
        <div className="px-6 sm:px-8 py-8">
          <p className="text-[0.9rem]" style={{ color: 'var(--color-cloud)' }}>
            Antes de reservar necesitas al menos un servicio con tarifa. Ve a <strong style={{ color: 'var(--color-paper)' }}>Servicios & tarifas</strong> y crea uno (o carga el catálogo base).
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="px-6 sm:px-8 py-6 flex flex-col gap-5">
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Cliente *" htmlFor="bk-client" active={clientName.length > 0}>
              <input id="bk-client" type="text" value={clientName} onChange={(e) => { setClientName(e.target.value); setClientId(''); }} autoComplete="off" autoFocus style={fieldInputStyle} />
            </Field>
            {store.clients.length > 0 ? (
              <Field label="…o elige uno existente" htmlFor="bk-client-pick" active>
                <select id="bk-client-pick" value={clientId} onChange={(e) => onPickClient(e.target.value)} style={fieldInputStyle}>
                  <option value="">— Nuevo / sin vincular —</option>
                  {store.clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Proyecto" htmlFor="bk-project-a" active={project.length > 0}>
                <input id="bk-project-a" type="text" value={project} onChange={(e) => setProject(e.target.value)} autoComplete="off" style={fieldInputStyle} />
              </Field>
            )}
            {store.clients.length > 0 && (
              <Field label="Proyecto" htmlFor="bk-project" active={project.length > 0}>
                <input id="bk-project" type="text" value={project} onChange={(e) => setProject(e.target.value)} autoComplete="off" style={fieldInputStyle} />
              </Field>
            )}
            <Field label="Servicio *" htmlFor="bk-service" active>
              <select id="bk-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={fieldInputStyle}>
                {activeServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ${formatMXN(s.rate)}/{s.unit}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha *" htmlFor="bk-date" active>
              <input id="bk-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldInputStyle} />
            </Field>
            <Field label="Hora de inicio" htmlFor="bk-time" active>
              <select id="bk-time" value={time} onChange={(e) => setTime(e.target.value)} style={fieldInputStyle}>
                {HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </Field>
            <Field label="Duración (horas)" htmlFor="bk-duration" active>
              <input id="bk-duration" type="number" min={1} max={14} value={duration} onChange={(e) => setDuration(Math.max(1, Math.min(14, Number(e.target.value) || 1)))} style={fieldInputStyle} />
            </Field>
            <Field label="Depósito recibido (MXN)" htmlFor="bk-deposit" active hint="Con depósito la reserva queda confirmada">
              <input id="bk-deposit" type="number" min={0} step={500} value={deposit} onChange={(e) => setDeposit(Math.max(0, Number(e.target.value) || 0))} style={fieldInputStyle} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notas" htmlFor="bk-notes" active={notes.length > 0}>
                <textarea id="bk-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={fieldInputStyle} />
              </Field>
            </div>
          </div>

          {!clientId && clientName.trim().length > 1 && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none" data-cursor="hover">
              <input type="checkbox" checked={saveClient} onChange={(e) => setSaveClient(e.target.checked)} className="accent-[#00c629] w-3.5 h-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-cloud)' }}>
                Guardar «{clientName.trim()}» en el directorio de clientes
              </span>
            </label>
          )}

          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] px-4 py-3"
            style={{ background: 'color-mix(in srgb, var(--color-signal) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--color-signal) 18%, transparent)' }}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-cloud)' }}>Total</span>
              <span className="font-display text-[1.3rem]" style={{ color: 'var(--color-signal)', letterSpacing: '-0.02em' }}>${formatMXN(amount)}</span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--color-mist)' }}>MXN</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-cloud)' }}>
              {clamped >= amount && amount > 0 ? 'Liquidada' : clamped > 0 ? `Confirmada · depósito $${formatMXN(clamped)}` : 'Pendiente de depósito'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <GhostButton onClick={closeBookingModal}>Cancelar</GhostButton>
            <SignalButton type="submit" disabled={!valid}>
              <IconCheck width={13} height={13} strokeWidth={2} />
              {d?.id ? 'Guardar cambios' : 'Crear reservación'}
            </SignalButton>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * RESERVACIONES — tabla CRUD
 * ───────────────────────────────────────────────────────────────────────── */

export function BookingsPage({ embedded }: { embedded?: boolean }) {
  const { store, query, setQuery, openBookingModal, setBookingStatus, setBookingPayment, deleteBooking } = useAdmin();
  const [tab, setTab] = useState<'all' | BookingStatus>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const q = query.trim().toLowerCase();

  const sorted = useMemo(
    () => [...store.bookings].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)),
    [store.bookings],
  );
  const filtered = useMemo(() => {
    const searched = q ? sorted.filter((b) => matches(q, b.clientName, b.project, b.serviceName)) : sorted;
    const byTab = tab === 'all' ? searched : searched.filter((b) => b.status === tab);
    return embedded ? byTab.slice(0, 6) : byTab;
  }, [sorted, q, tab, embedded]);

  const tabs: { id: 'all' | BookingStatus; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'confirmed', label: 'Confirmadas' },
    { id: 'completed', label: 'Completadas' },
  ];

  if (store.bookings.length === 0) {
    return (
      <EmptyState
        Icon={IconBookings}
        title="Aún no hay reservaciones"
        body="Crea la primera con «Nueva reserva», o convierte una solicitud del sitio web. Cada reserva alimenta el calendario, los ingresos y la analítica."
        action={
          <SignalButton onClick={() => openBookingModal()}>
            <IconPlus width={13} height={13} /> Nueva reserva
          </SignalButton>
        }
        compact={embedded}
      />
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.md, ease: ease.outExpo }}
      className="rounded-[14px] overflow-hidden"
      style={CARD_STYLE}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: HAIRLINE }}>
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-[1.05rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.012em' }}>
            {embedded ? 'Próximas reservaciones' : 'Reservaciones'}
          </h3>
          <ResultCount shown={filtered.length} total={sorted.length} />
        </div>
        {!embedded && (
          <div className="inline-flex p-[3px] rounded-full overflow-x-auto max-w-full" style={{ background: 'color-mix(in srgb, var(--color-paper) 5%, transparent)' }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                data-cursor="hover"
                className="px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.16em] transition-all whitespace-nowrap"
                style={{
                  background: tab === t.id ? 'color-mix(in srgb, var(--color-signal) 16%, transparent)' : 'transparent',
                  color: tab === t.id ? 'var(--color-signal)' : 'var(--color-cloud)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[820px]">
          <thead>
            <tr>
              {['Cliente', 'Servicio', 'Fecha', 'Monto', 'Pago', 'Estado', ''].map((h, i) => (
                <th key={`${h}-${i}`} className="text-left font-mono text-[10px] uppercase tracking-[0.18em] px-5 py-3" style={{ color: 'var(--color-mist)', borderBottom: HAIRLINE }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center">
                  <p className="text-[0.88rem] mb-3" style={{ color: 'var(--color-cloud)' }}>
                    {q ? <>Sin resultados para <strong style={{ color: 'var(--color-paper)' }}>«{query.trim()}»</strong></> : 'No hay reservaciones en este estado.'}
                  </p>
                  {q && <GhostButton small onClick={() => setQuery('')}>Limpiar búsqueda</GhostButton>}
                </td>
              </tr>
            )}
            {filtered.map((b) => (
              <BookingRow key={b.id} b={b} onEdit={() => openBookingModal({
                id: b.id,
                clientName: b.clientName,
                clientId: b.clientId,
                project: b.project,
                serviceId: b.serviceId,
                date: b.date,
                time: b.time,
                duration: b.duration,
                deposit: b.deposit,
                notes: b.notes,
              })} onDelete={() => setConfirmId(b.id)} onStatus={(s) => setBookingStatus(b.id, s)} onPaid={() => setBookingPayment(b.id, 'paid')} />
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteBooking(confirmId)}
        title="Eliminar reservación"
        body="Se quitará del calendario, ingresos y analítica. Esta acción no se puede deshacer."
      />
    </motion.section>
  );
}

function BookingRow({ b, onEdit, onDelete, onStatus, onPaid }: { b: Booking; onEdit: () => void; onDelete: () => void; onStatus: (s: BookingStatus) => void; onPaid: () => void }) {
  const cell: React.CSSProperties = { borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 3%, transparent)' };
  return (
    <tr className="transition-colors hover:bg-white/[0.02] group">
      <td className="px-5 py-3.5" style={cell}>
        <div className="flex items-center gap-3">
          <Avatar name={b.clientName} accent={b.accent} />
          <div className="min-w-0">
            <div className="text-[0.86rem] truncate" style={{ color: 'var(--color-paper)' }}>{b.clientName}</div>
            <div className="text-[0.74rem] truncate" style={{ color: 'var(--color-mist)' }}>{b.project ?? '—'}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-[0.82rem]" style={{ ...cell, color: 'var(--color-cloud)' }}>{b.serviceName}</td>
      <td className="px-5 py-3.5 font-mono text-[0.78rem] whitespace-nowrap" style={{ ...cell, color: 'var(--color-cloud)' }}>
        {formatDateMX(b.date)} · {b.time} · {b.duration}h
      </td>
      <td className="px-5 py-3.5 font-display text-[0.95rem] whitespace-nowrap" style={{ ...cell, color: 'var(--color-paper)' }}>${formatMXN(b.amount)}</td>
      <td className="px-5 py-3.5" style={cell}><PaymentPill status={b.paymentStatus} /></td>
      <td className="px-5 py-3.5" style={cell}><StatusPill status={b.status} /></td>
      <td className="px-5 py-3.5" style={cell}>
        {/* Always visible on touch (<md); hover-revealed on desktop */}
        <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
          {b.status === 'pending' && (
            <RowAction title="Confirmar" onClick={() => onStatus('confirmed')}><IconCheck width={13} height={13} /></RowAction>
          )}
          {b.status === 'confirmed' && (
            <RowAction title="Marcar completada" onClick={() => onStatus('completed')}><IconCheck width={13} height={13} /></RowAction>
          )}
          {b.paymentStatus !== 'paid' && b.status !== 'cancelled' && (
            <RowAction title="Marcar pagada" onClick={onPaid}>$</RowAction>
          )}
          <RowAction title="Editar" onClick={onEdit}><IconEdit width={13} height={13} /></RowAction>
          <RowAction title="Eliminar" onClick={onDelete}><IconTrash width={13} height={13} /></RowAction>
        </div>
      </td>
    </tr>
  );
}

function RowAction({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      data-cursor="hover"
      className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] transition-colors hover:bg-white/[0.06]"
      style={{ color: 'var(--color-cloud)' }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * CALENDARIO — semana dinámica con navegación
 * ───────────────────────────────────────────────────────────────────────── */

const ROW_H = 46;
const CAL_HOURS = Array.from({ length: CAL_END_HOUR - CAL_START_HOUR }, (_, i) => CAL_START_HOUR + i);

export function CalendarPage() {
  const { store, openBookingModal } = useAdmin();
  const [offset, setOffset] = useState(0);
  const days = useMemo(() => weekDaysFor(offset), [offset]);
  const label = weekLabelFor(days);

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="hidden sm:flex items-center gap-3">
          {ROOMS.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-cloud)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: ACCENT_FG[r.accent] }} />
              {r.short}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <GhostButton small onClick={() => setOffset((o) => o - 1)}><IconChevronLeft width={12} height={12} /></GhostButton>
          <button
            type="button"
            onClick={() => setOffset(0)}
            data-cursor="hover"
            className="px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.18em] transition-colors"
            style={{
              color: offset === 0 ? 'var(--color-signal)' : 'var(--color-cloud)',
              background: offset === 0 ? 'color-mix(in srgb, var(--color-signal) 10%, transparent)' : 'transparent',
            }}
          >
            {label}
          </button>
          <GhostButton small onClick={() => setOffset((o) => o + 1)}><IconChevronRight width={12} height={12} /></GhostButton>
        </div>
      </div>

      <div className="rounded-[14px] overflow-hidden" style={CARD_STYLE}>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid color-mix(in srgb, var(--color-paper) 6%, transparent)' }}>
              <div />
              {days.map((d) => {
                const count = store.bookings.filter((b) => b.date === d.key && b.status !== 'cancelled').length;
                return (
                  <div key={d.key} className="px-2 py-3 text-center" style={{ borderLeft: HAIRLINE }}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: d.isToday ? 'var(--color-signal)' : 'var(--color-mist)' }}>{d.label}</div>
                    <div className="font-display text-[1.05rem] mt-0.5" style={{ color: d.isToday ? 'var(--color-signal)' : count ? 'var(--color-paper)' : 'var(--color-mist)' }}>{d.date}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
              <div>
                {CAL_HOURS.map((h) => (
                  <div key={h} className="relative" style={{ height: ROW_H }}>
                    <span className="absolute -top-1.5 right-2 font-mono text-[10px]" style={{ color: 'var(--color-mist)' }}>{h}:00</span>
                  </div>
                ))}
              </div>
              {days.map((d) => {
                const dayBookings = store.bookings.filter((b) => b.date === d.key && b.status !== 'cancelled');
                return (
                  <div key={d.key} className="relative" style={{ borderLeft: HAIRLINE, height: ROW_H * CAL_HOURS.length, background: d.isToday ? 'color-mix(in srgb, var(--color-signal) 2.5%, transparent)' : 'transparent' }}>
                    {CAL_HOURS.map((h) => (
                      <div key={h} style={{ height: ROW_H, borderTop: '1px solid color-mix(in srgb, var(--color-paper) 4%, transparent)' }} />
                    ))}
                    {dayBookings.map((b) => {
                      const startH = parseHour(b.time);
                      const top = (startH - CAL_START_HOUR) * ROW_H;
                      const maxH = (CAL_END_HOUR - startH) * ROW_H;
                      const height = Math.max(30, Math.min(b.duration * ROW_H, maxH)) - 4;
                      const room = ROOM_BY_ID[b.room];
                      const endH = Math.min(startH + b.duration, CAL_END_HOUR);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() =>
                            openBookingModal({
                              id: b.id,
                              clientName: b.clientName,
                              clientId: b.clientId,
                              project: b.project,
                              serviceId: b.serviceId,
                              date: b.date,
                              time: b.time,
                              duration: b.duration,
                              deposit: b.deposit,
                              notes: b.notes,
                            })
                          }
                          className="absolute left-1 right-1 rounded-[7px] px-2 py-1.5 overflow-hidden text-left"
                          style={{ top: top + 2, height, background: ACCENT_SOFT[room.accent], borderLeft: `2px solid ${ACCENT_FG[room.accent]}` }}
                          data-cursor="hover"
                          title={`${b.clientName} · ${b.serviceName} · ${b.time}–${endH}:00 · ${room.name}`}
                        >
                          <div className="font-mono text-[9px] tracking-[0.08em]" style={{ color: ACCENT_FG[room.accent] }}>
                            {b.time}–{endH}:00
                          </div>
                          <div className="text-[0.74rem] truncate" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>{b.clientName}</div>
                          {height > 52 && <div className="text-[0.66rem] truncate" style={{ color: 'var(--color-cloud)' }}>{b.serviceName}</div>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-mist)' }}>
        Click en un bloque para editar la reserva
      </p>
    </motion.section>
  );
}
