/**
 * Sistema: cuentas de acceso (usuarios + contraseñas) y datos & respaldo.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ease, dur } from '../../lib/motion';
import { useAdmin } from './AdminContext';
import { cloudFetchProfiles, type CloudProfile } from '../../lib/cloud';
import {
  Avatar,
  CARD_STYLE,
  ConfirmDialog,
  EmptyState,
  Field,
  GhostButton,
  HAIRLINE,
  ModalShell,
  SignalButton,
  fieldInputStyle,
  IconCheck,
  IconDatabase,
  IconDownload,
  IconKey,
  IconTrash,
  IconUpload,
  IconUserPlus,
} from './AdminUI';
import {
  EMPTY_STORE,
  STORAGE_BUDGET_BYTES,
  exportStoreJSON,
  importStoreJSON,
  persistStore,
  relativeTime,
  storeSizeBytes,
  type Role,
  type UserAccount,
} from '../../lib/admin-store';

/* ─────────────────────────────────────────────────────────────────────────
 * USUARIOS (modo nube) — lectura de profiles; altas/bajas en Supabase.
 * ───────────────────────────────────────────────────────────────────────── */

function CloudUsersPage() {
  const { currentUser } = useAdmin();
  const [profiles, setProfiles] = useState<CloudProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    cloudFetchProfiles()
      .then((p) => { if (alive) setProfiles(p); })
      .catch((e: Error) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }} className="max-w-[760px]">
      <div className="rounded-[14px] p-6 mb-6" style={{ ...CARD_STYLE, border: '1px solid color-mix(in srgb, var(--color-signal) 14%, transparent)' }}>
        <div className="flex items-center gap-2.5 mb-2">
          <IconKey width={15} height={15} style={{ color: 'var(--color-signal)' }} />
          <h3 className="font-display text-[1.05rem]" style={{ color: 'var(--color-paper)' }}>Accesos en la nube (Supabase Auth)</h3>
        </div>
        <p className="text-[0.85rem] max-w-[62ch]" style={{ color: 'var(--color-cloud)' }}>
          Altas, bajas y contraseñas se administran en el dashboard de Supabase (Authentication → Users) y la tabla <code>profiles</code> (approved = acceso). Ver docs/FASE1_SUPABASE.md.
        </p>
      </div>

      {error ? (
        <p className="text-[0.85rem]" style={{ color: 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))' }}>No se pudo cargar el equipo: {error}</p>
      ) : profiles === null ? (
        <div className="rounded-[14px] h-[64px] animate-pulse" style={{ background: 'color-mix(in srgb, var(--color-paper) 4%, transparent)' }} aria-hidden />
      ) : (
        <div className="flex flex-col gap-3">
          {profiles.map((p) => (
            <div key={p.id} className="rounded-[14px] px-5 py-4 flex items-center gap-4" style={CARD_STYLE}>
              <Avatar name={p.name} accent={p.role === 'admin' ? 'signal' : 'pearl'} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-[1rem] truncate" style={{ color: 'var(--color-paper)', letterSpacing: '-0.01em' }}>{p.name}</span>
                  {p.id === currentUser?.id && (
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-signal) 14%, transparent)', color: 'var(--color-signal)' }}>
                      Tú
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] mt-0.5" style={{ color: 'var(--color-mist)' }}>
                  {p.role === 'admin' ? 'Administrador' : 'Staff'} · alta {relativeTime(p.createdAt).toLowerCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * USUARIOS
 * ───────────────────────────────────────────────────────────────────────── */

export function UsersPage() {
  const { store, currentUser, addUser, resetPassword, deleteUser, notify, cloud } = useAdmin();
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState<UserAccount | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (cloud) return <CloudUsersPage />;

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-mist)' }}>
          {store.users.length} cuentas · acceso al CRM
        </span>
        <SignalButton small onClick={() => setAdding(true)}>
          <IconUserPlus width={12} height={12} /> Agregar usuario
        </SignalButton>
      </div>

      <div className="flex flex-col gap-3 max-w-[760px]">
        {store.users.map((u) => (
          <div key={u.id} className="rounded-[14px] px-5 py-4 flex flex-wrap items-center gap-4" style={CARD_STYLE}>
            <Avatar name={u.name} accent={u.role === 'admin' ? 'signal' : 'pearl'} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="font-display text-[1rem] truncate" style={{ color: 'var(--color-paper)', letterSpacing: '-0.01em' }}>{u.name}</span>
                {u.id === currentUser?.id && (
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-signal) 14%, transparent)', color: 'var(--color-signal)' }}>
                    Tú
                  </span>
                )}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] mt-0.5" style={{ color: 'var(--color-mist)' }}>
                @{u.username} · {u.role === 'admin' ? 'Administrador' : 'Staff'} · alta {relativeTime(u.createdAt).toLowerCase()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GhostButton small onClick={() => setResetting(u)}>
                <IconKey width={11} height={11} /> Contraseña
              </GhostButton>
              {u.id !== currentUser?.id && (
                <button
                  type="button"
                  onClick={() => setConfirmId(u.id)}
                  title="Eliminar"
                  aria-label={`Eliminar ${u.username}`}
                  data-cursor="hover"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors"
                  style={{ color: 'var(--color-cloud)' }}
                >
                  <IconTrash width={14} height={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 max-w-[68ch] text-[0.78rem]" style={{ color: 'var(--color-mist)' }}>
        Las contraseñas se guardan con hash (SHA-256 + salt) en este navegador. Es un control de acceso para el equipo del estudio — la seguridad multi-dispositivo real llega con la fase de backend.
      </p>

      <AddUserModal
        open={adding}
        onClose={() => setAdding(false)}
        onSave={async (name, username, password, role) => {
          const res = await addUser(name, username, password, role);
          if (!res.ok && res.error) notify(res.error);
          else setAdding(false);
        }}
      />
      <ResetPasswordModal
        user={resetting}
        onClose={() => setResetting(null)}
        onSave={async (pw) => {
          if (resetting) await resetPassword(resetting.id, pw);
          setResetting(null);
        }}
      />
      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (!confirmId) return;
          const res = deleteUser(confirmId);
          if (!res.ok && res.error) notify(res.error);
        }}
        title="Eliminar usuario"
        body="La persona perderá acceso al CRM en este navegador."
      />
    </motion.section>
  );
}

function AddUserModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (name: string, username: string, password: string, role: Role) => Promise<void> }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('staff');
  const [busy, setBusy] = useState(false);
  const valid = name.trim().length > 1 && username.trim().length > 2 && password.length >= 6;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    await onSave(name, username, password, role);
    setBusy(false);
    setName('');
    setUsername('');
    setPassword('');
    setRole('staff');
  };

  return (
    <ModalShell open={open} onClose={onClose} label="Accesos" title={<>Nuevo <span className="italic-emphasis">usuario.</span></>}>
      <form onSubmit={submit} className="px-6 sm:px-8 py-6 flex flex-col gap-5">
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field label="Nombre *" htmlFor="us-name" active={name.length > 0}>
            <input id="us-name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" autoFocus style={fieldInputStyle} />
          </Field>
          <Field label="Usuario *" htmlFor="us-user" active={username.length > 0} hint="Para iniciar sesión, ej. nico">
            <input id="us-user" type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} autoComplete="off" style={fieldInputStyle} />
          </Field>
          <Field label="Contraseña *" htmlFor="us-pass" active={password.length > 0} hint="Mínimo 6 caracteres">
            <input id="us-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" style={fieldInputStyle} />
          </Field>
          <Field label="Rol" htmlFor="us-role" active>
            <select id="us-role" value={role} onChange={(e) => setRole(e.target.value as Role)} style={fieldInputStyle}>
              <option value="staff">Staff</option>
              <option value="admin">Administrador</option>
            </select>
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <SignalButton type="submit" disabled={!valid || busy}>
            <IconCheck width={13} height={13} strokeWidth={2} /> {busy ? 'Creando…' : 'Crear cuenta'}
          </SignalButton>
        </div>
      </form>
    </ModalShell>
  );
}

function ResetPasswordModal({ user, onClose, onSave }: { user: UserAccount | null; onClose: () => void; onSave: (pw: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const valid = password.length >= 6;
  return (
    <ModalShell open={user !== null} onClose={onClose} label={user ? `@${user.username}` : ''} title={<>Nueva <span className="italic-emphasis">contraseña.</span></>}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid || busy) return;
          setBusy(true);
          await onSave(password);
          setBusy(false);
          setPassword('');
        }}
        className="px-6 sm:px-8 py-6 flex flex-col gap-5"
      >
        <Field label="Contraseña nueva *" htmlFor="rp-pass" active={password.length > 0} hint="Mínimo 6 caracteres">
          <input id="rp-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" autoFocus style={fieldInputStyle} />
        </Field>
        <div className="flex items-center justify-end gap-3 pt-1">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <SignalButton type="submit" disabled={!valid || busy}>
            <IconKey width={12} height={12} /> {busy ? 'Guardando…' : 'Actualizar'}
          </SignalButton>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * DATOS & RESPALDO
 * ───────────────────────────────────────────────────────────────────────── */

export function DataPage() {
  const { store, replaceStore, notify, logout, cloud, saveSettings } = useAdmin();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [phone, setPhone] = useState(store.settings.notifyPhone ?? '');
  const phoneClean = phone.replace(/[^\d]/g, '');
  const phoneValid = phoneClean.length === 0 || (phoneClean.length >= 11 && phoneClean.length <= 15);

  const used = storeSizeBytes();
  const pct = Math.min(100, Math.round((used / STORAGE_BUDGET_BYTES) * 100));

  const doExport = () => {
    const blob = new Blob([exportStoreJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    a.href = url;
    a.download = `malonic-crm-respaldo-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Respaldo descargado');
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const next = importStoreJSON(text);
      replaceStore(next);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo importar el respaldo');
    }
  };

  const counts: [string, number][] = [
    ['Usuarios', store.users.length],
    ['Clientes', store.clients.length],
    ['Servicios', store.services.length],
    ['Reservaciones', store.bookings.length],
    ['Entradas de blog', store.posts.length],
    ['Solicitudes', store.requests.length],
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.md, ease: ease.outExpo }} className="max-w-[760px]">
      {/* Storage */}
      <div className="rounded-[14px] p-6 mb-6" style={CARD_STYLE}>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-display text-[1.05rem]" style={{ color: 'var(--color-paper)' }}>Almacenamiento local</h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: pct > 80 ? 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))' : 'var(--color-mist)' }}>
            {(used / 1024).toFixed(0)} KB · {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: 'color-mix(in srgb, var(--color-paper) 6%, transparent)' }}>
          <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: pct > 80 ? 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))' : 'var(--color-signal)' }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
          {counts.map(([label, n]) => (
            <div key={label} className="flex items-baseline justify-between gap-3" style={{ borderBottom: HAIRLINE, paddingBottom: 6 }}>
              <span className="text-[0.8rem]" style={{ color: 'var(--color-cloud)' }}>{label}</span>
              <span className="font-mono text-[0.8rem]" style={{ color: 'var(--color-paper)' }}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notificaciones WhatsApp */}
      <div className="rounded-[14px] p-6 mb-6" style={CARD_STYLE}>
        <h3 className="font-display text-[1.05rem] mb-2" style={{ color: 'var(--color-paper)' }}>Notificaciones WhatsApp</h3>
        <p className="text-[0.85rem] mb-5 max-w-[60ch]" style={{ color: 'var(--color-cloud)' }}>
          Número que recibe los avisos automáticos (solicitud nueva, sesiones de mañana, cobranza, resumen semanal). Formato internacional sin «+», ej. <span className="font-mono">528112345678</span>. Puedes cambiarlo aquí cuando quieras.
        </p>
        <div className="flex flex-wrap items-end gap-4 max-w-[480px]">
          <div className="flex-1 min-w-[220px]">
            <Field label="WhatsApp para avisos" htmlFor="set-phone" active hint={!phoneValid ? 'Entre 11 y 15 dígitos (incluye lada de país, 52…)' : undefined}>
              <input
                id="set-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="52XXXXXXXXXX"
                autoComplete="off"
                style={fieldInputStyle}
              />
            </Field>
          </div>
          <SignalButton
            small
            disabled={!phoneValid || phoneClean === (store.settings.notifyPhone ?? '')}
            onClick={() => saveSettings({ notifyPhone: phoneClean || undefined })}
          >
            Guardar
          </SignalButton>
        </div>
        {store.settings.notifyPhone && (
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-signal)' }}>
            Activo: +{store.settings.notifyPhone}
          </p>
        )}
      </div>

      {/* Backup */}
      <div className="rounded-[14px] p-6 mb-6" style={CARD_STYLE}>
        <h3 className="font-display text-[1.05rem] mb-2" style={{ color: 'var(--color-paper)' }}>Respaldo</h3>
        <p className="text-[0.85rem] mb-5 max-w-[60ch]" style={{ color: 'var(--color-cloud)' }}>
          Los datos viven en este navegador. Descarga un respaldo JSON con frecuencia (y antes de limpiar el navegador o cambiar de equipo); puedes restaurarlo aquí mismo.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <SignalButton onClick={doExport}>
            <IconDownload width={13} height={13} /> Descargar respaldo
          </SignalButton>
          <GhostButton onClick={() => fileRef.current?.click()}>
            <IconUpload width={13} height={13} /> Restaurar desde archivo
          </GhostButton>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              doImport(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Backend note */}
      <div className="rounded-[14px] p-6 mb-6" style={{ ...CARD_STYLE, border: '1px solid color-mix(in srgb, var(--color-signal) 14%, transparent)' }}>
        <div className="flex items-center gap-2.5 mb-2">
          <IconDatabase width={15} height={15} style={{ color: 'var(--color-signal)' }} />
          <h3 className="font-display text-[1.05rem]" style={{ color: 'var(--color-paper)' }}>
            {cloud ? 'Nube conectada · Supabase' : 'Fase 2 · Backend'}
          </h3>
        </div>
        <p className="text-[0.85rem] max-w-[62ch]" style={{ color: 'var(--color-cloud)' }}>
          {cloud
            ? 'Este CRM opera contra Supabase: las solicitudes de cualquier visitante llegan a la bandeja, el blog es público para todo el mundo y la operación se sincroniza entre dispositivos. La copia local funciona como caché.'
            : 'Hoy las solicitudes del sitio y el blog público funcionan en este navegador. Al conectar la base de datos en la nube, las solicitudes de cualquier visitante llegarán aquí y el blog será visible para todo el mundo — sin cambiar tu forma de trabajar.'}
        </p>
      </div>

      {/* Danger zone — solo en modo local (en nube borraría solo la caché y desincronizaría) */}
      {!cloud && (
        <div className="rounded-[14px] p-6" style={{ ...CARD_STYLE, border: '1px solid color-mix(in srgb, var(--color-brass) 22%, transparent)' }}>
          <h3 className="font-display text-[1.05rem] mb-2" style={{ color: 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))' }}>Zona de riesgo</h3>
          <p className="text-[0.85rem] mb-4 max-w-[60ch]" style={{ color: 'var(--color-cloud)' }}>
            Borra todos los datos del CRM en este navegador (incluidas las cuentas de acceso). Descarga un respaldo antes.
          </p>
          <GhostButton onClick={() => setConfirmReset(true)}>
            <IconTrash width={12} height={12} /> Borrar todos los datos
          </GhostButton>
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          persistStore({ ...EMPTY_STORE });
          replaceStore({ ...EMPTY_STORE });
          logout();
        }}
        title="¿Borrar todo?"
        body="Se eliminan usuarios, clientes, servicios, reservaciones, blog y solicitudes de este navegador. Volverás a la pantalla de configuración inicial."
        confirmLabel="Sí, borrar todo"
      />
    </motion.section>
  );
}
