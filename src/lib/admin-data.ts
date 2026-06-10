/**
 * Mock CRM data for the /admin dashboard.
 * Domain: Malonic Records — Dolby Atmos 7.1.4 studio in San Pedro Garza García.
 * Currency: MXN. Dates: ISO. Accents reserved for signal/brass/pearl — never new colors.
 *
 * Data model mirrors the real operational loop of a boutique studio:
 *   inquiry → cotización → depósito → confirmada → sesión → entrega → liquidación.
 * See docs/CRM_Necesidades_Admin.md for the rationale behind every field.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Shared accent system — restricted palette so tiles read as Malonic
 * editorial (warm monochrome + signal), never carnival.
 * ───────────────────────────────────────────────────────────────────────── */

export type AvatarAccent = 'signal' | 'brass' | 'pearl' | 'paper';

export const ACCENT_BG: Record<AvatarAccent, string> = {
  signal: 'color-mix(in srgb, var(--color-signal) 86%, var(--color-ink))',
  brass: 'color-mix(in srgb, var(--color-brass) 88%, var(--color-ink))',
  pearl: 'color-mix(in srgb, var(--color-pearl) 70%, var(--color-ink))',
  paper: 'color-mix(in srgb, var(--color-paper) 78%, var(--color-ink))',
};

/** Soft (low-opacity) fill of the same accent — used for calendar blocks. */
export const ACCENT_SOFT: Record<AvatarAccent, string> = {
  signal: 'color-mix(in srgb, var(--color-signal) 16%, transparent)',
  brass: 'color-mix(in srgb, var(--color-brass) 22%, transparent)',
  pearl: 'color-mix(in srgb, var(--color-pearl) 16%, transparent)',
  paper: 'color-mix(in srgb, var(--color-paper) 12%, transparent)',
};

export const ACCENT_FG: Record<AvatarAccent, string> = {
  signal: 'var(--color-signal)',
  brass: 'color-mix(in srgb, var(--color-brass) 80%, var(--color-paper))',
  pearl: 'var(--color-pearl)',
  paper: 'var(--color-paper)',
};

/* ─────────────────────────────────────────────────────────────────────────
 * Rooms — the scarce, billable resource. One room booked = one revenue lane.
 * ───────────────────────────────────────────────────────────────────────── */

export type RoomId = 'atmos' | 'live' | 'booth';

export type Room = {
  id: RoomId;
  name: string;
  short: string;
  description: string;
  accent: AvatarAccent;
};

export const ROOMS: Room[] = [
  { id: 'atmos', name: 'Sala A · Control Room', short: 'Sala A', description: 'Dolby Atmos 7.1.4 · Genelec', accent: 'signal' },
  { id: 'live',  name: 'Sala B · Live Room',    short: 'Sala B', description: 'Tracking · hasta 8 músicos',  accent: 'brass'  },
  { id: 'booth', name: 'Vocal Booth',           short: 'Booth',  description: 'Voces · locución',            accent: 'pearl'  },
];

export const ROOM_BY_ID: Record<RoomId, Room> = ROOMS.reduce(
  (acc, r) => ({ ...acc, [r.id]: r }),
  {} as Record<RoomId, Room>,
);

/* ─────────────────────────────────────────────────────────────────────────
 * Engineers — who is assigned, their load and availability.
 * ───────────────────────────────────────────────────────────────────────── */

export type Availability = 'available' | 'in-session' | 'off';

export type Engineer = {
  id: string;
  name: string;
  role: string;
  atmosCertified: boolean;
  sessionsMonth: number;
  hoursMonth: number;
  availability: Availability;
  accent: AvatarAccent;
};

export const ENGINEERS: Engineer[] = [
  { id: 'nico',  name: 'Nico Reyes',   role: 'Lead Engineer · Atmos',     atmosCertified: true,  sessionsMonth: 9, hoursMonth: 62, availability: 'in-session', accent: 'signal' },
  { id: 'sofia', name: 'Sofía Marín',  role: 'Mezcla & Mastering',        atmosCertified: true,  sessionsMonth: 6, hoursMonth: 34, availability: 'available',  accent: 'brass'  },
  { id: 'ivan',  name: 'Iván Cortés',  role: 'Tracking · Asistente',      atmosCertified: false, sessionsMonth: 4, hoursMonth: 18, availability: 'available',  accent: 'pearl'  },
];

export const ENGINEER_BY_ID: Record<string, Engineer> = ENGINEERS.reduce(
  (acc, e) => ({ ...acc, [e.id]: e }),
  {} as Record<string, Engineer>,
);

/* ─────────────────────────────────────────────────────────────────────────
 * Services — the single source of truth for pricing.
 * ───────────────────────────────────────────────────────────────────────── */

export type ServiceCategory = 'grabacion' | 'mezcla' | 'mastering' | 'produccion';
export type ServiceUnit = 'hora' | 'canción' | 'track' | 'proyecto';

export type Service = {
  id: string;
  name: string;
  category: ServiceCategory;
  rate: number;
  unit: ServiceUnit;
  room: RoomId;
  atmos: boolean;
  monthRevenue: number;
};

export const SERVICES: Service[] = [
  { id: 'grab-atmos',   name: 'Grabación Atmos 7.1.4', category: 'grabacion',  rate:  4500, unit: 'hora',     room: 'atmos', atmos: true,  monthRevenue: 92000 },
  { id: 'mezcla-atmos', name: 'Mezcla Atmos 7.1.4',    category: 'mezcla',     rate: 15000, unit: 'proyecto', room: 'atmos', atmos: true,  monthRevenue: 48000 },
  { id: 'mezcla-est',   name: 'Mezcla Estéreo',         category: 'mezcla',     rate:  5000, unit: 'canción',  room: 'atmos', atmos: false, monthRevenue: 35000 },
  { id: 'produccion',   name: 'Producción Musical',     category: 'produccion', rate: 15000, unit: 'proyecto', room: 'live',  atmos: false, monthRevenue: 28000 },
  { id: 'mastering',    name: 'Mastering',              category: 'mastering',  rate:  3000, unit: 'track',     room: 'atmos', atmos: false, monthRevenue: 15000 },
  { id: 'grab-est',     name: 'Grabación Estéreo',      category: 'grabacion',  rate:  2500, unit: 'hora',     room: 'live',  atmos: false, monthRevenue: 10000 },
];

/* ─────────────────────────────────────────────────────────────────────────
 * Bookings — the operational heart. Money is tracked in two parts:
 * deposit (locks the room) + balance (settled on delivery).
 * ───────────────────────────────────────────────────────────────────────── */

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';
export type PaymentStatus = 'paid' | 'deposit' | 'pending' | 'overdue';

export type Booking = {
  id: number;
  client: string;
  project: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: BookingStatus;
  amount: number;
  deposit: number;
  paymentStatus: PaymentStatus;
  room: RoomId;
  engineerId: string;
  genre: string;
  accent: AvatarAccent;
};

export const BOOKINGS: Booking[] = [
  { id: 1, client: 'Carlos Mendoza',  project: 'Álbum "Ecos"',        service: 'Grabación Atmos 7.1.4', date: '2026-05-22', time: '10:00', duration: 4,  status: 'confirmed', amount: 18000, deposit:  9000, paymentStatus: 'deposit',  room: 'atmos', engineerId: 'nico',  genre: 'Pop',         accent: 'signal' },
  { id: 2, client: 'Laura Vega',      project: 'EP "Nocturnos"',      service: 'Mezcla Estéreo',         date: '2026-05-22', time: '15:00', duration: 8,  status: 'pending',   amount:  5000, deposit:     0, paymentStatus: 'pending',  room: 'atmos', engineerId: 'sofia', genre: 'Electrónica', accent: 'brass'  },
  { id: 3, client: 'Roberto Salinas', project: 'Sencillo "Norte"',    service: 'Mastering',              date: '2026-05-23', time: '09:00', duration: 2,  status: 'confirmed', amount:  3000, deposit:  1500, paymentStatus: 'deposit',  room: 'atmos', engineerId: 'sofia', genre: 'Regional',    accent: 'pearl'  },
  { id: 4, client: 'Andrea Ruiz',     project: 'Podcast "Sonido MX"', service: 'Grabación Estéreo',      date: '2026-05-23', time: '14:00', duration: 4,  status: 'confirmed', amount: 10000, deposit:  5000, paymentStatus: 'deposit',  room: 'live',  engineerId: 'ivan',  genre: 'Podcast',     accent: 'signal' },
  { id: 5, client: 'Diego Torres',    project: 'Score Documental',    service: 'Mezcla Atmos',           date: '2026-05-26', time: '09:00', duration: 12, status: 'pending',   amount:  8000, deposit:     0, paymentStatus: 'pending',  room: 'atmos', engineerId: 'nico',  genre: 'Cine',        accent: 'brass'  },
  { id: 6, client: 'Mariana López',   project: 'Álbum "Raíces"',      service: 'Producción Musical',     date: '2026-05-28', time: '09:00', duration: 8,  status: 'confirmed', amount: 15000, deposit:  7500, paymentStatus: 'deposit',  room: 'live',  engineerId: 'nico',  genre: 'Latin',       accent: 'paper'  },
  { id: 7, client: 'Fernanda Díaz',   project: 'Sencillo "Vuelo"',    service: 'Grabación Atmos 7.1.4', date: '2026-05-21', time: '10:00', duration: 6,  status: 'completed', amount: 27000, deposit: 27000, paymentStatus: 'paid',     room: 'atmos', engineerId: 'nico',  genre: 'Pop',         accent: 'pearl'  },
  { id: 8, client: 'Emilio Garza',    project: 'Mix 5 tracks',        service: 'Mezcla Estéreo',         date: '2026-05-20', time: '09:00', duration: 8,  status: 'completed', amount: 25000, deposit: 12500, paymentStatus: 'overdue',  room: 'atmos', engineerId: 'sofia', genre: 'Hip-Hop',     accent: 'brass'  },
];

/* ─────────────────────────────────────────────────────────────────────────
 * Clients — directory with lifetime value.
 * ───────────────────────────────────────────────────────────────────────── */

export type Client = {
  name: string;
  artist: string;
  genre: string;
  sessions: number;
  revenue: number;
  lastVisit: string;
  label: string;
  accent: AvatarAccent;
};

export const CLIENTS: Client[] = [
  { name: 'Carlos Mendoza',  artist: 'Carlos M.',   genre: 'Pop',        sessions: 12, revenue: 186000, lastVisit: '2026-05-22', label: 'Independiente', accent: 'signal' },
  { name: 'Laura Vega',      artist: 'LVGA',        genre: 'Electrónica',sessions:  8, revenue: 124000, lastVisit: '2026-05-22', label: 'DistroKid',     accent: 'brass'  },
  { name: 'Roberto Salinas', artist: 'Rob Salinas', genre: 'Regional',   sessions: 15, revenue: 210000, lastVisit: '2026-05-23', label: 'Sony Music',    accent: 'pearl'  },
  { name: 'Andrea Ruiz',     artist: 'Sonido MX',   genre: 'Podcast',    sessions: 24, revenue:  96000, lastVisit: '2026-05-23', label: 'Spotify',       accent: 'signal' },
  { name: 'Diego Torres',    artist: 'Diego T.',    genre: 'Film Score', sessions:  3, revenue:  48000, lastVisit: '2026-05-26', label: 'Independiente', accent: 'brass'  },
  { name: 'Mariana López',   artist: 'Mariana L.',  genre: 'Latin',      sessions:  6, revenue:  92000, lastVisit: '2026-05-28', label: 'Universal',     accent: 'paper'  },
];

/* ─────────────────────────────────────────────────────────────────────────
 * Activity feed.
 * ───────────────────────────────────────────────────────────────────────── */

export type Activity = {
  /** Bolded subject at the start of the entry (client / system actor). */
  actor?: string;
  text: string;
  time: string;
  tone: AvatarAccent;
};

export const ACTIVITIES: Activity[] = [
  { actor: 'Carlos Mendoza',  text: 'confirmó sesión Atmos para el 22 de mayo.',          time: 'Hace 15 min', tone: 'signal' },
  { actor: 'Laura Vega',      text: 'solicitó reservación de Mezcla Estéreo.',            time: 'Hace 1 hora', tone: 'brass'  },
  { actor: 'Fernanda Díaz',   text: 'completó sesión de Grabación Atmos.',                time: 'Hace 3 horas',tone: 'pearl'  },
  { actor: 'Diego Torres',    text: 'envió solicitud para Mezcla Atmos documental.',      time: 'Hace 5 horas',tone: 'brass'  },
  { actor: 'Emilio Garza',    text: 'tiene balance vencido de $12,500 MXN.',              time: 'Ayer',        tone: 'signal' },
  { text: 'Se actualizó tarifa de Mastering a $3,000 MXN/track.',                         time: 'Ayer',        tone: 'paper'  },
];

/* ─────────────────────────────────────────────────────────────────────────
 * Time series — weekly hours + monthly revenue trend.
 * ───────────────────────────────────────────────────────────────────────── */

export type WeeklyHour = { day: string; hours: number; revenue: number };

export const WEEKLY_HOURS: WeeklyHour[] = [
  { day: 'Lun', hours:  8, revenue: 36000 },
  { day: 'Mar', hours: 12, revenue: 54000 },
  { day: 'Mié', hours:  6, revenue: 18000 },
  { day: 'Jue', hours: 10, revenue: 45000 },
  { day: 'Vie', hours: 14, revenue: 63000 },
  { day: 'Sáb', hours:  4, revenue: 12000 },
  { day: 'Dom', hours:  0, revenue:     0 },
];

export type MonthRevenue = { month: string; revenue: number };

export const MONTHLY_REVENUE: MonthRevenue[] = [
  { month: 'Dic', revenue: 142000 },
  { month: 'Ene', revenue: 168000 },
  { month: 'Feb', revenue: 155000 },
  { month: 'Mar', revenue: 198000 },
  { month: 'Abr', revenue: 215000 },
  { month: 'May', revenue: 228000 },
];

/* ─────────────────────────────────────────────────────────────────────────
 * Calendar week — anchored to the week containing most bookings (May 18–24,
 * 2026). Hardcoded so the demo is deterministic and aligns with mock data.
 * ───────────────────────────────────────────────────────────────────────── */

export type CalDay = { key: string; label: string; date: number };

export const CALENDAR_WEEK_LABEL = '18 – 24 May 2026';

export const CAL_DAYS: CalDay[] = [
  { key: '2026-05-18', label: 'Lun', date: 18 },
  { key: '2026-05-19', label: 'Mar', date: 19 },
  { key: '2026-05-20', label: 'Mié', date: 20 },
  { key: '2026-05-21', label: 'Jue', date: 21 },
  { key: '2026-05-22', label: 'Vie', date: 22 },
  { key: '2026-05-23', label: 'Sáb', date: 23 },
  { key: '2026-05-24', label: 'Dom', date: 24 },
];

export const CAL_START_HOUR = 8;
export const CAL_END_HOUR = 22;

/* ─────────────────────────────────────────────────────────────────────────
 * Helpers.
 * ───────────────────────────────────────────────────────────────────────── */

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

export const formatMXN = (n: number): string =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(n);

export const formatDateMX = (iso: string): string => {
  const [, mm, dd] = iso.split('-');
  return `${dd}/${mm}`;
};

export const parseHour = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h + (m || 0) / 60;
};

/** Outstanding balance on a booking (0 if cancelled or fully paid). */
export const balanceOf = (b: Booking): number =>
  b.status === 'cancelled' || b.paymentStatus === 'paid' ? 0 : b.amount - b.deposit;

/* Derived metrics take the live bookings array (admin state) so the
 * dashboard reacts when new reservations are created in-session. */

/** Receivables = confirmed/completed bookings with an outstanding balance, overdue first. */
export const receivablesOf = (list: Booking[]): Booking[] =>
  list
    .filter((b) => (b.status === 'confirmed' || b.status === 'completed') && balanceOf(b) > 0)
    .sort((a, b) => Number(b.paymentStatus === 'overdue') - Number(a.paymentStatus === 'overdue'));

export const totalReceivableOf = (list: Booking[]): number =>
  receivablesOf(list).reduce((acc, b) => acc + balanceOf(b), 0);

export const totalOverdueOf = (list: Booking[]): number =>
  receivablesOf(list)
    .filter((b) => b.paymentStatus === 'overdue')
    .reduce((acc, b) => acc + balanceOf(b), 0);

/** Deposits held = money received on confirmed (not-yet-completed) sessions. */
export const depositsHeldOf = (list: Booking[]): number =>
  list.filter((b) => b.status === 'confirmed').reduce((acc, b) => acc + b.deposit, 0);

export const avgTicketOf = (list: Booking[]): number => {
  const active = list.filter((b) => b.status !== 'cancelled');
  if (active.length === 0) return 0;
  return Math.round(active.reduce((acc, b) => acc + b.amount, 0) / active.length);
};

/** Sessions falling inside the calendar demo week (non-cancelled). */
export const weekSessionsOf = (list: Booking[]): number =>
  list.filter((b) => b.status !== 'cancelled' && CAL_DAYS.some((d) => d.key === b.date)).length;

export const CURRENT_MONTH_REVENUE = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue;
