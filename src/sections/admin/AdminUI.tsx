/**
 * AdminUI — shared visual vocabulary of the CRM.
 * Icons (inline SVG, currentColor), card styles, pills, fields, modal shell,
 * empty states and the chart set (pure SVG/div — no chart lib).
 * Palette discipline: accent = var(--color-signal); status uses brass/pearl.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ease, dur } from '../../lib/motion';
import {
  ACCENT_FG_MAP,
  type IconProps,
} from './icons';
import { formatMXN, type AvatarAccent, type BookingStatus, type PaymentStatus, type RequestStatus, type PostStatus } from '../../lib/admin-store';

export * from './icons';

/* ─────────────────────────────────────────────────────────────────────────
 * Accent maps (CSS color-mix over tokens)
 * ───────────────────────────────────────────────────────────────────────── */

export const ACCENT_BG: Record<AvatarAccent, string> = {
  signal: 'color-mix(in srgb, var(--color-signal) 86%, var(--color-ink))',
  brass: 'color-mix(in srgb, var(--color-brass) 88%, var(--color-ink))',
  pearl: 'color-mix(in srgb, var(--color-pearl) 70%, var(--color-ink))',
  paper: 'color-mix(in srgb, var(--color-paper) 78%, var(--color-ink))',
};

export const ACCENT_SOFT: Record<AvatarAccent, string> = {
  signal: 'color-mix(in srgb, var(--color-signal) 16%, transparent)',
  brass: 'color-mix(in srgb, var(--color-brass) 22%, transparent)',
  pearl: 'color-mix(in srgb, var(--color-pearl) 16%, transparent)',
  paper: 'color-mix(in srgb, var(--color-paper) 12%, transparent)',
};

export const ACCENT_FG = ACCENT_FG_MAP;

export const CARD_STYLE: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--color-smoke) 92%, transparent)',
  border: '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)',
};

export const HAIRLINE = '1px solid color-mix(in srgb, var(--color-paper) 5%, transparent)';

/* ─────────────────────────────────────────────────────────────────────────
 * Small building blocks
 * ───────────────────────────────────────────────────────────────────────── */

export function SectionHead({ label, title, right }: { label: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
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

export function Stat({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div>
      <div
        className={mono ? 'font-mono text-[0.85rem]' : 'font-display text-[1.05rem]'}
        style={{ color: accent ? 'var(--color-signal)' : 'var(--color-paper)', letterSpacing: mono ? 0 : '-0.012em' }}
      >
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] mt-0.5" style={{ color: 'var(--color-mist)' }}>
        {label}
      </div>
    </div>
  );
}

export function Avatar({ name, accent, size = 36 }: { name: string; accent: AvatarAccent; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-mono font-medium shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.3, background: ACCENT_BG[accent], color: 'var(--color-ink)' }}
    >
      {initials}
    </div>
  );
}

export function GhostButton({ children, onClick, small, disabled }: { children: React.ReactNode; onClick?: () => void; small?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-cursor="hover"
      className={`inline-flex items-center gap-2 rounded-full font-mono uppercase transition-opacity hover:opacity-75 disabled:opacity-35 ${small ? 'px-3 py-1.5 text-[10px] tracking-[0.16em]' : 'px-4 py-2 text-[10px] tracking-[0.18em]'}`}
      style={{ border: '1px solid color-mix(in srgb, var(--color-paper) 14%, transparent)', color: 'var(--color-paper)' }}
    >
      {children}
    </button>
  );
}

export function SignalButton({ children, onClick, type = 'button', disabled, small }: { children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; small?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-cursor="signal"
      className={`inline-flex items-center gap-2 rounded-full font-mono uppercase font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${small ? 'px-3 py-1.5 text-[10px] tracking-[0.16em]' : 'px-5 py-2.5 text-[10px] tracking-[0.2em]'}`}
      style={{ background: 'var(--color-signal)', color: 'var(--color-ink)', boxShadow: '0 12px 36px -14px rgba(0,198,41,0.5)' }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Status pills
 * ───────────────────────────────────────────────────────────────────────── */

const pill = (bg: string, fg: string, label: string, dot = true) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.16em] whitespace-nowrap" style={{ background: bg, color: fg }}>
    {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />}
    {label}
  </span>
);

export function StatusPill({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, [string, string, string]> = {
    confirmed: ['color-mix(in srgb, var(--color-signal) 14%, transparent)', 'var(--color-signal)', 'Confirmada'],
    pending: ['color-mix(in srgb, var(--color-brass) 18%, transparent)', 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))', 'Pendiente'],
    cancelled: ['color-mix(in srgb, var(--color-paper) 8%, transparent)', 'var(--color-cloud)', 'Cancelada'],
    completed: ['color-mix(in srgb, var(--color-pearl) 14%, transparent)', 'var(--color-pearl)', 'Completada'],
  };
  const [bg, fg, label] = map[status];
  return pill(bg, fg, label);
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, [string, string, string]> = {
    paid: ['color-mix(in srgb, var(--color-signal) 14%, transparent)', 'var(--color-signal)', 'Pagado'],
    deposit: ['color-mix(in srgb, var(--color-pearl) 14%, transparent)', 'var(--color-pearl)', 'Depósito'],
    pending: ['color-mix(in srgb, var(--color-paper) 8%, transparent)', 'var(--color-cloud)', 'Sin pago'],
    overdue: ['color-mix(in srgb, var(--color-brass) 20%, transparent)', 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))', 'Vencido'],
  };
  const [bg, fg, label] = map[status];
  return pill(bg, fg, label);
}

export function RequestPill({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, [string, string, string]> = {
    new: ['color-mix(in srgb, var(--color-signal) 14%, transparent)', 'var(--color-signal)', 'Nueva'],
    reviewed: ['color-mix(in srgb, var(--color-pearl) 14%, transparent)', 'var(--color-pearl)', 'Revisada'],
    converted: ['color-mix(in srgb, var(--color-paper) 10%, transparent)', 'var(--color-paper)', 'Convertida'],
    discarded: ['color-mix(in srgb, var(--color-paper) 6%, transparent)', 'var(--color-mist)', 'Descartada'],
  };
  const [bg, fg, label] = map[status];
  return pill(bg, fg, label);
}

export function PostPill({ status }: { status: PostStatus }) {
  return status === 'published'
    ? pill('color-mix(in srgb, var(--color-signal) 14%, transparent)', 'var(--color-signal)', 'Publicado')
    : pill('color-mix(in srgb, var(--color-paper) 8%, transparent)', 'var(--color-cloud)', 'Borrador');
}

/* ─────────────────────────────────────────────────────────────────────────
 * Fields (floating-label .field pattern from index.css)
 * ───────────────────────────────────────────────────────────────────────── */

export const fieldInputStyle: React.CSSProperties = { color: 'var(--color-paper)', colorScheme: 'dark' };

export function Field({ label, htmlFor, active, children, hint }: { label: string; htmlFor: string; active: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div
        className={`field${active ? ' is-active' : ''}`}
        style={{ borderColor: 'color-mix(in srgb, var(--color-paper) 20%, transparent)', color: 'var(--color-pearl)' }}
      >
        <label htmlFor={htmlFor} style={{ color: 'var(--color-cloud)' }}>{label}</label>
        {children}
      </div>
      {hint ? (
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-mist)' }}>{hint}</p>
      ) : null}
    </div>
  );
}

export function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      data-cursor="hover"
      className="flex items-center justify-between w-full py-2"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-cloud)' }}>{label}</span>
      <span
        className="relative w-10 h-[22px] rounded-full transition-colors"
        style={{ background: checked ? 'var(--color-signal)' : 'color-mix(in srgb, var(--color-paper) 12%, transparent)' }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className="absolute top-[3px] w-4 h-4 rounded-full transition-all"
          style={{ left: checked ? 'calc(100% - 19px)' : '3px', background: checked ? 'var(--color-ink)' : 'var(--color-cloud)' }}
        />
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Modal shell + confirm dialog
 * ───────────────────────────────────────────────────────────────────────── */

export function ModalShell({
  open,
  onClose,
  label,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  title: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Conditional render — no AnimatePresence exits. Managed exits proved to
  // zombie (opacity-0 overlay left in the DOM blocking pointer events) under
  // motion v12 + React 19 with frequent provider re-renders. Entry-only.
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6 perspective-1200">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(10,10,10,0.62)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: dur.xs }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${wide ? 'sm:max-w-[760px]' : 'sm:max-w-[560px]'} max-h-[92vh] overflow-y-auto rounded-t-[20px] sm:rounded-[20px]`}
        style={{
          background:
            'linear-gradient(165deg, color-mix(in srgb, var(--color-smoke) 97%, transparent) 0%, color-mix(in srgb, var(--color-ink) 97%, transparent) 100%)',
          border: '1px solid color-mix(in srgb, var(--color-paper) 9%, transparent)',
          boxShadow: '0 40px 110px -30px rgba(0,0,0,0.8), 0 0 60px -30px rgba(0,198,41,0.18)',
        }}
        initial={{ opacity: 0, y: 36, rotateX: -7, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: dur.sm, ease: ease.outExpo }}
      >
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4" style={{ borderBottom: HAIRLINE }}>
          <div>
            <span className="label" style={{ color: 'var(--color-cloud)' }}>{label}</span>
            <h3 className="font-display text-[1.4rem] mt-1" style={{ color: 'var(--color-paper)', letterSpacing: '-0.018em' }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            data-cursor="hover"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 shrink-0"
            style={{ border: '1px solid color-mix(in srgb, var(--color-paper) 12%, transparent)', color: 'var(--color-paper)' }}
          >
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Eliminar',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
}) {
  return (
    <ModalShell open={open} onClose={onClose} label="Confirmar" title={title}>
      <div className="px-6 sm:px-8 py-6 flex flex-col gap-6">
        <p className="text-[0.92rem]" style={{ color: 'var(--color-cloud)' }}>{body}</p>
        <div className="flex items-center justify-end gap-3">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <button
            type="button"
            data-cursor="hover"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-full font-mono text-[10px] uppercase tracking-[0.2em] font-medium transition-opacity hover:opacity-85"
            style={{ background: 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))', color: 'var(--color-ink)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Empty state
 * ───────────────────────────────────────────────────────────────────────── */

export function EmptyState({
  Icon,
  title,
  body,
  action,
  compact,
}: {
  Icon: (p: IconProps) => React.JSX.Element;
  title: string;
  body?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-[14px] flex flex-col items-center text-center gap-3 ${compact ? 'px-6 py-10' : 'px-6 py-16'}`} style={CARD_STYLE}>
      <span
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ background: 'color-mix(in srgb, var(--color-signal) 10%, transparent)', color: 'var(--color-signal)' }}
      >
        <Icon width={18} height={18} />
      </span>
      <h4 className="font-display text-[1.1rem]" style={{ color: 'var(--color-paper)', letterSpacing: '-0.012em' }}>{title}</h4>
      {body ? <p className="text-[0.85rem] max-w-[44ch]" style={{ color: 'var(--color-cloud)' }}>{body}</p> : null}
      {action ? <div className="mt-2 flex items-center gap-3 flex-wrap justify-center">{action}</div> : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Charts — pure SVG/div, token colors only
 * ───────────────────────────────────────────────────────────────────────── */

export function VBarChart({
  data,
  height = 150,
  format = (v: number) => `$${Math.round(v / 1000)}K`,
}: {
  data: { label: string; value: number; hot?: boolean }[];
  height?: number;
  format?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3 relative" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 30);
        return (
          <div key={`${d.label}-${i}`} className="flex-1 flex flex-col items-center gap-2 group min-w-0">
            <span className="font-mono text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ color: 'var(--color-paper)' }}>
              {format(d.value)}
            </span>
            <motion.div
              initial={{ height: 2 }}
              animate={{ height: Math.max(h, 2) }}
              transition={{ duration: 0.7, ease: ease.outExpo, delay: 0.08 + i * 0.04 }}
              className="w-full rounded-t-[3px]"
              style={{
                background:
                  d.value === 0
                    ? 'color-mix(in srgb, var(--color-paper) 6%, transparent)'
                    : d.hot ?? d.value >= max
                      ? 'var(--color-signal)'
                      : 'color-mix(in srgb, var(--color-signal) 34%, var(--color-mist))',
                maxWidth: 44,
              }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] truncate max-w-full" style={{ color: 'var(--color-mist)' }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function HBarList({
  data,
  format = (v: number) => `$${formatMXN(v)}`,
}: {
  data: { label: string; value: number; accent?: boolean }[];
  format?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-3.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between mb-1.5 gap-3">
            <span className="text-[0.8rem] truncate" style={{ color: 'var(--color-cloud)' }}>{d.label}</span>
            <span className="font-mono text-[0.78rem] whitespace-nowrap" style={{ color: 'var(--color-paper)' }}>{format(d.value)}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'color-mix(in srgb, var(--color-paper) 6%, transparent)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.8, ease: ease.outExpo }}
              className="h-full rounded-full"
              style={{ background: d.accent ? 'var(--color-signal)' : 'color-mix(in srgb, var(--color-brass) 70%, var(--color-paper))' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const DONUT_COLORS = ['var(--color-signal)', 'color-mix(in srgb, var(--color-brass) 80%, var(--color-paper))', 'var(--color-pearl)', 'color-mix(in srgb, var(--color-paper) 55%, transparent)'];

export function Donut({ data, centerLabel, centerValue }: { data: { label: string; value: number }[]; centerLabel: string; centerValue: string }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
        <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label={centerLabel}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="color-mix(in srgb, var(--color-paper) 7%, transparent)" strokeWidth="12" />
          {total > 0 &&
            data.map((d, i) => {
              const frac = d.value / total;
              const seg = (
                <motion.circle
                  key={d.label}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                  strokeWidth="12"
                  strokeLinecap="butt"
                  strokeDasharray={`${frac * C} ${C}`}
                  strokeDashoffset={-offset * C}
                  transform="rotate(-90 70 70)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }}
                />
              );
              offset += frac;
              return seg;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[1.3rem] leading-none" style={{ color: 'var(--color-paper)', letterSpacing: '-0.02em' }}>{centerValue}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] mt-1" style={{ color: 'var(--color-mist)' }}>{centerLabel}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 min-w-0">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="text-[0.8rem] truncate" style={{ color: 'var(--color-cloud)' }}>{d.label}</span>
            <span className="font-mono text-[0.75rem] ml-auto pl-3" style={{ color: 'var(--color-paper)' }}>
              {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FunnelRow({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] w-[110px] shrink-0 text-right" style={{ color: 'var(--color-mist)' }}>
            {s.label}
          </span>
          <div className="flex-1 h-7 rounded-[6px] overflow-hidden" style={{ background: 'color-mix(in srgb, var(--color-paper) 4%, transparent)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max((s.value / max) * 100, s.value > 0 ? 6 : 0)}%` }}
              transition={{ duration: 0.7, ease: ease.outExpo, delay: i * 0.07 }}
              className="h-full flex items-center px-2.5"
              style={{ background: `color-mix(in srgb, var(--color-signal) ${22 + i * 18}%, transparent)` }}
            >
              <span className="font-mono text-[10px]" style={{ color: 'var(--color-paper)' }}>{s.value}</span>
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * KPI tile
 * ───────────────────────────────────────────────────────────────────────── */

export function KpiTile({
  Icon,
  value,
  label,
  meta,
  tone = 'signal',
  index = 0,
}: {
  Icon: (p: IconProps) => React.JSX.Element;
  value: string;
  label: string;
  meta?: string;
  tone?: 'signal' | 'brass' | 'pearl';
  index?: number;
}) {
  const accent =
    tone === 'brass'
      ? 'color-mix(in srgb, var(--color-brass) 85%, var(--color-paper))'
      : tone === 'pearl'
        ? 'var(--color-pearl)'
        : 'var(--color-signal)';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.md, ease: ease.outExpo, delay: 0.05 + index * 0.04 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-[14px] p-5"
      style={CARD_STYLE}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}>
          <Icon width={16} height={16} />
        </div>
        {meta ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-right" style={{ color: accent }}>{meta}</span>
        ) : null}
      </div>
      <div className="font-display text-[1.85rem] leading-none truncate" style={{ color: 'var(--color-paper)', letterSpacing: '-0.025em' }}>
        {value}
      </div>
      <div className="mt-1.5 text-[0.78rem]" style={{ color: 'var(--color-cloud)' }}>{label}</div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Toast + skeleton
 * ───────────────────────────────────────────────────────────────────────── */

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed z-[70] left-0 right-0 flex justify-center pointer-events-none bottom-[calc(84px_+_env(safe-area-inset-bottom))] md:bottom-8">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: dur.xs, ease: ease.outExpo }}
        className="pointer-events-auto inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full mx-4"
        style={{
          background: 'color-mix(in srgb, var(--color-smoke) 97%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-signal) 25%, transparent)',
          boxShadow: '0 18px 48px -18px rgba(0,0,0,0.65)',
        }}
        role="status"
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-signal)' }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-paper)' }}>{message}</span>
      </motion.div>
    </div>
  );
}

export function PageSkeleton() {
  const block: React.CSSProperties = {
    background: 'color-mix(in srgb, var(--color-paper) 4%, transparent)',
    border: '1px solid color-mix(in srgb, var(--color-paper) 4%, transparent)',
  };
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[14px] h-[124px]" style={block} />
        ))}
      </div>
      <div className="rounded-[14px] h-[248px] mb-6" style={block} />
      <div className="grid gap-6 [grid-template-columns:1fr] xl:[grid-template-columns:1fr_380px]">
        <div className="rounded-[14px] h-[320px]" style={block} />
        <div className="rounded-[14px] h-[320px]" style={block} />
      </div>
    </div>
  );
}

/** Search-aware list header counter. */
export function ResultCount({ shown, total }: { shown: number; total: number }) {
  if (shown === total) return null;
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-mist)' }}>
      {shown} de {total}
    </span>
  );
}

/** Tiny debounce — used by the blog editor autosave hint. */
export function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}
