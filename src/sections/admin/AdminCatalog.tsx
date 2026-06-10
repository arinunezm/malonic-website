/**
 * Catálogo del estudio: directorio de clientes + servicios & tarifas.
 * Ambos son CRUD completos pensados para que Nico los administre sin código.
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ease, dur } from '../../lib/motion';
import { useAdmin } from './AdminContext';
import {
  Avatar,
  CARD_STYLE,
  ConfirmDialog,
  EmptyState,
  Field,
  GhostButton,
  HAIRLINE,
  ModalShell,
  ResultCount,
  SignalButton,
  Stat,
  ToggleRow,
  fieldInputStyle,
  ACCENT_FG,
  IconCheck,
  IconEdit,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSpeaker,
  IconTrash,
  IconUsers,
} from './AdminUI';
import {
  CATEGORY_LABEL,
  ROOMS,
  ROOM_BY_ID,
  SERVICE_UNITS,
  clientStatsOf,
  formatDateMX,
  formatMXN,
  type Client,
  type Service,
  type ServiceCategory,
  type ServiceUnit,
  type RoomId,
} from '../../lib/admin-store';

/* ─────────────────────────────────────────────────────────────────────────
 * CLIENTES
 * ───────────────────────────────────────────────────────────────────────── */

type ClientDraft = Partial<Client> & { name: string };

export function ClientsPage() {
  const { store, query, setQuery, saveClient, deleteClient, openBookingModal } = useAdmin();
  const [editing, setEditing] = useState<ClientDraft | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      q
        ? store.clients.filter((c) => [c.name, c.artist, c.genre, c.email].some((f) => f?.toLowerCase().includes(q)))
        : store.clients,
    [store.clients, q],
  );

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>
            {store.clients.length} registrados
          </span>
          <ResultCount shown={filtered.length} total={store.clients.length} />
        </div>
        <SignalButton small onClick={() => setEditing({ name: '' })}>
          <IconPlus width={12} height={12} /> Agregar cliente
        </SignalButton>
      </div>

      {store.clients.length === 0 ? (
        <EmptyState
          Icon={IconUsers}
          title="Directorio vacío"
          body="Da de alta a tus clientes con su contacto y género. También se crean solos al guardar una reservación con cliente nuevo."
          action={
            <SignalButton onClick={() => setEditing({ name: '' })}>
              <IconPlus width={13} height={13} /> Primer cliente
            </SignalButton>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          Icon={IconSearch}
          title="Sin resultados"
          body={`Ningún cliente coincide con «${query.trim()}».`}
          action={<GhostButton onClick={() => setQuery('')}>Limpiar búsqueda</GhostButton>}
          compact
        />
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filtered.map((c) => {
            const stats = clientStatsOf(store.bookings, c);
            return (
              <motion.article key={c.id} whileHover={{ y: -2 }} className="relative rounded-[14px] p-5 group" style={CARD_STYLE}>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={c.name} accent={c.accent} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[1rem] truncate" style={{ color: 'var(--color-paper)', letterSpacing: '-0.01em' }}>{c.name}</div>
                    <div className="text-[0.74rem] truncate" style={{ color: 'var(--color-mist)' }}>
                      {[c.artist, c.genre].filter(Boolean).join(' · ') || c.email || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                    <button type="button" onClick={() => setEditing(c)} title="Editar" aria-label={`Editar ${c.name}`} data-cursor="hover" className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/[0.06]" style={{ color: 'var(--color-cloud)' }}>
                      <IconEdit width={13} height={13} />
                    </button>
                    <button type="button" onClick={() => setConfirmId(c.id)} title="Eliminar" aria-label={`Eliminar ${c.name}`} data-cursor="hover" className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/[0.06]" style={{ color: 'var(--color-cloud)' }}>
                      <IconTrash width={13} height={13} />
                    </button>
                  </div>
                </div>
                {(c.email || c.phone) && (
                  <div className="mb-3 text-[0.76rem] truncate" style={{ color: 'var(--color-cloud)' }}>
                    {[c.email, c.phone].filter(Boolean).join(' · ')}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 pt-3" style={{ borderTop: HAIRLINE }}>
                  <Stat label="Sesiones" value={String(stats.sessions)} />
                  <Stat label="Facturado" value={`$${formatMXN(stats.revenue)}`} accent />
                  <Stat label="Última" value={stats.lastVisit ? formatDateMX(stats.lastVisit) : '—'} mono />
                </div>
                <button
                  type="button"
                  onClick={() => openBookingModal({ clientName: c.name, clientId: c.id })}
                  data-cursor="hover"
                  className="mt-4 w-full px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-[0.16em] transition-all hover:opacity-80"
                  style={{ background: 'color-mix(in srgb, var(--color-signal) 10%, transparent)', color: 'var(--color-signal)' }}
                >
                  Reservar sesión
                </button>
              </motion.article>
            );
          })}
        </div>
      )}

      <ClientModal draft={editing} onClose={() => setEditing(null)} onSave={(d) => { saveClient(d); setEditing(null); }} />
      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteClient(confirmId)}
        title="Eliminar cliente"
        body="Sus reservaciones se conservan (quedan sin vínculo al directorio)."
      />
    </motion.section>
  );
}

function ClientModal({ draft, onClose, onSave }: { draft: ClientDraft | null; onClose: () => void; onSave: (d: ClientDraft) => void }) {
  const open = draft !== null;
  const [form, setForm] = useState<ClientDraft>({ name: '' });
  const [seedId, setSeedId] = useState<string | null>(null);

  const key = draft ? draft.id ?? 'new' : null;
  if (open && draft && seedId !== key) {
    setSeedId(key);
    setForm({ ...draft });
  }
  if (!open && seedId !== null) setSeedId(null);

  const set = (k: keyof ClientDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.name.trim().length > 1;

  return (
    <ModalShell open={open} onClose={onClose} label="Directorio" title={draft?.id ? <>Editar <span className="italic-emphasis">cliente.</span></> : <>Nuevo <span className="italic-emphasis">cliente.</span></>}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSave(form);
        }}
        className="px-6 sm:px-8 py-6 flex flex-col gap-5"
      >
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field label="Nombre *" htmlFor="cl-name" active={(form.name ?? '').length > 0}>
            <input id="cl-name" type="text" value={form.name} onChange={set('name')} autoComplete="off" autoFocus style={fieldInputStyle} />
          </Field>
          <Field label="Artista / proyecto" htmlFor="cl-artist" active={!!form.artist}>
            <input id="cl-artist" type="text" value={form.artist ?? ''} onChange={set('artist')} autoComplete="off" style={fieldInputStyle} />
          </Field>
          <Field label="Género" htmlFor="cl-genre" active={!!form.genre}>
            <input id="cl-genre" type="text" value={form.genre ?? ''} onChange={set('genre')} autoComplete="off" style={fieldInputStyle} />
          </Field>
          <Field label="Correo" htmlFor="cl-email" active={!!form.email}>
            <input id="cl-email" type="email" value={form.email ?? ''} onChange={set('email')} autoComplete="off" style={fieldInputStyle} />
          </Field>
          <Field label="Teléfono" htmlFor="cl-phone" active={!!form.phone}>
            <input id="cl-phone" type="tel" value={form.phone ?? ''} onChange={set('phone')} autoComplete="off" style={fieldInputStyle} />
          </Field>
          <Field label="Notas" htmlFor="cl-notes" active={!!form.notes}>
            <input id="cl-notes" type="text" value={form.notes ?? ''} onChange={set('notes')} autoComplete="off" style={fieldInputStyle} />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <SignalButton type="submit" disabled={!valid}>
            <IconCheck width={13} height={13} strokeWidth={2} /> Guardar
          </SignalButton>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * SERVICIOS & TARIFAS
 * ───────────────────────────────────────────────────────────────────────── */

type ServiceDraft = Partial<Service> & { name: string; rate: number };

export function ServicesPage() {
  const { store, saveService, deleteService, loadBaseCatalog } = useAdmin();
  const [editing, setEditing] = useState<ServiceDraft | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>
          {store.services.length} servicios · MXN · fuente de verdad de tus tarifas
        </span>
        <SignalButton small onClick={() => setEditing({ name: '', rate: 0 })}>
          <IconPlus width={12} height={12} /> Nuevo servicio
        </SignalButton>
      </div>

      {store.services.length === 0 ? (
        <EmptyState
          Icon={IconSettings}
          title="Define tu catálogo"
          body="Los servicios alimentan el modal de reservas y los reportes de ingresos. Empieza desde cero o carga el catálogo base de Malonic (los del sitio público) y ajusta tarifas."
          action={
            <>
              <SignalButton onClick={loadBaseCatalog}>Cargar catálogo base</SignalButton>
              <GhostButton onClick={() => setEditing({ name: '', rate: 0 })}>
                <IconPlus width={12} height={12} /> Crear desde cero
              </GhostButton>
            </>
          }
        />
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {store.services.map((s) => {
            const room = ROOM_BY_ID[s.room];
            return (
              <motion.article key={s.id} whileHover={{ y: -2 }} className="rounded-[14px] p-5 flex flex-col gap-4 group" style={{ ...CARD_STYLE, opacity: s.active ? 1 : 0.55 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] mb-1" style={{ color: 'var(--color-mist)' }}>
                      {CATEGORY_LABEL[s.category]}
                      {!s.active && ' · Inactivo'}
                    </div>
                    <h4 className="font-display text-[1.1rem] truncate" style={{ color: 'var(--color-paper)', letterSpacing: '-0.012em' }}>{s.name}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {s.atmos && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-mono text-[9px] uppercase tracking-[0.14em]" style={{ background: 'color-mix(in srgb, var(--color-signal) 14%, transparent)', color: 'var(--color-signal)' }}>
                        <IconSpeaker width={10} height={10} /> Atmos
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[1.8rem]" style={{ color: 'var(--color-signal)', letterSpacing: '-0.025em' }}>${formatMXN(s.rate)}</span>
                  <span className="font-mono text-[0.72rem]" style={{ color: 'var(--color-mist)' }}>/ {s.unit}</span>
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: HAIRLINE }}>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-cloud)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: ACCENT_FG[room.accent] }} />
                    {room.short}
                  </span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setEditing(s)} data-cursor="hover" className="font-mono text-[10px] uppercase tracking-[0.16em] transition-opacity hover:opacity-100 opacity-70" style={{ color: 'var(--color-signal)' }}>
                      <IconEdit width={11} height={11} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                      Editar tarifa
                    </button>
                    <button type="button" onClick={() => setConfirmId(s.id)} title="Eliminar" aria-label={`Eliminar ${s.name}`} data-cursor="hover" className="w-6 h-6 rounded-full flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-70 hover:!opacity-100 transition-opacity" style={{ color: 'var(--color-cloud)' }}>
                      <IconTrash width={12} height={12} />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <ServiceModal draft={editing} onClose={() => setEditing(null)} onSave={(d) => { saveService(d); setEditing(null); }} />
      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteService(confirmId)}
        title="Eliminar servicio"
        body="Las reservaciones existentes conservan el nombre y monto que ya tenían."
      />
    </motion.section>
  );
}

function ServiceModal({ draft, onClose, onSave }: { draft: ServiceDraft | null; onClose: () => void; onSave: (d: ServiceDraft) => void }) {
  const open = draft !== null;
  const [form, setForm] = useState<ServiceDraft>({ name: '', rate: 0 });
  const [seedId, setSeedId] = useState<string | null>(null);

  const key = draft ? draft.id ?? 'new' : null;
  if (open && draft && seedId !== key) {
    setSeedId(key);
    setForm({ category: 'grabacion', unit: 'hora', room: 'atmos', atmos: false, active: true, ...draft });
  }
  if (!open && seedId !== null) setSeedId(null);

  const valid = form.name.trim().length > 1 && form.rate >= 0;

  return (
    <ModalShell open={open} onClose={onClose} label="Catálogo" title={draft?.id ? <>Editar <span className="italic-emphasis">servicio.</span></> : <>Nuevo <span className="italic-emphasis">servicio.</span></>}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSave(form);
        }}
        className="px-6 sm:px-8 py-6 flex flex-col gap-5"
      >
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nombre del servicio *" htmlFor="sv-name" active={form.name.length > 0}>
              <input id="sv-name" type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoComplete="off" autoFocus style={fieldInputStyle} />
            </Field>
          </div>
          <Field label="Tarifa (MXN) *" htmlFor="sv-rate" active>
            <input id="sv-rate" type="number" min={0} step={100} value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: Math.max(0, Number(e.target.value) || 0) }))} style={fieldInputStyle} />
          </Field>
          <Field label="Unidad de cobro" htmlFor="sv-unit" active>
            <select id="sv-unit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as ServiceUnit }))} style={fieldInputStyle}>
              {SERVICE_UNITS.map((u) => (
                <option key={u} value={u}>por {u}</option>
              ))}
            </select>
          </Field>
          <Field label="Categoría" htmlFor="sv-cat" active>
            <select id="sv-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ServiceCategory }))} style={fieldInputStyle}>
              {(Object.keys(CATEGORY_LABEL) as ServiceCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </Field>
          <Field label="Sala" htmlFor="sv-room" active>
            <select id="sv-room" value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value as RoomId }))} style={fieldInputStyle}>
              {ROOMS.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex flex-col" style={{ borderTop: HAIRLINE, paddingTop: '0.5rem' }}>
          <ToggleRow label="Servicio Dolby Atmos" checked={!!form.atmos} onChange={(v) => setForm((f) => ({ ...f, atmos: v }))} />
          <ToggleRow label="Activo (visible al reservar)" checked={form.active !== false} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <SignalButton type="submit" disabled={!valid}>
            <IconCheck width={13} height={13} strokeWidth={2} /> Guardar
          </SignalButton>
        </div>
      </form>
    </ModalShell>
  );
}
