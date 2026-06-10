/**
 * Malonic CRM — local-first data layer.
 *
 * Everything the admin manages lives in ONE versioned localStorage document.
 * The store starts EMPTY (no demo data): Nico captures usuarios, clientes,
 * servicios, reservas y blog desde la UI. Export/Import JSON is the backup
 * mechanism until the backend phase (Supabase/API) replaces `loadStore` /
 * `persistStore` — keep all reads/writes going through this module so that
 * swap stays a one-file change.
 *
 * The public site shares the document for two bridges:
 *   - Booking form  → submitWebRequest()  (solicitudes inbox)
 *   - /blog         → getPublishedPosts() (posts published from the admin)
 * Both work same-browser only until the backend exists.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────── */

export type AvatarAccent = 'signal' | 'brass' | 'pearl' | 'paper';

export type Role = 'admin' | 'staff';

export type UserAccount = {
  id: string;
  name: string;
  username: string;
  passHash: string;
  salt: string;
  role: Role;
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  artist?: string;
  genre?: string;
  email?: string;
  phone?: string;
  notes?: string;
  accent: AvatarAccent;
  createdAt: string;
};

export type RoomId = 'atmos' | 'live' | 'booth';

export type Room = { id: RoomId; name: string; short: string; accent: AvatarAccent };

/** Physical rooms of the studio — infrastructure, not demo data. */
export const ROOMS: Room[] = [
  { id: 'atmos', name: 'Sala A · Control Room', short: 'Sala A', accent: 'signal' },
  { id: 'live',  name: 'Sala B · Live Room',    short: 'Sala B', accent: 'brass'  },
  { id: 'booth', name: 'Vocal Booth',           short: 'Booth',  accent: 'pearl'  },
];

export const ROOM_BY_ID: Record<RoomId, Room> = Object.fromEntries(
  ROOMS.map((r) => [r.id, r]),
) as Record<RoomId, Room>;

export type ServiceCategory = 'grabacion' | 'mezcla' | 'mastering' | 'produccion' | 'renta';
export type ServiceUnit = 'hora' | 'sesión' | 'canción' | 'track' | 'proyecto' | 'día';

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  grabacion: 'Grabación',
  mezcla: 'Mezcla',
  mastering: 'Mastering',
  produccion: 'Producción',
  renta: 'Renta',
};

export const SERVICE_UNITS: ServiceUnit[] = ['hora', 'sesión', 'canción', 'track', 'proyecto', 'día'];

export type Service = {
  id: string;
  name: string;
  category: ServiceCategory;
  rate: number;
  unit: ServiceUnit;
  room: RoomId;
  atmos: boolean;
  active: boolean;
};

/** Real Malonic catalogue (public-site pricing) — optional one-click template. */
export const BASE_CATALOG: Omit<Service, 'id'>[] = [
  { name: 'Grabación',           category: 'grabacion', rate: 7000,  unit: 'sesión',   room: 'live',  atmos: false, active: true },
  { name: 'Mezcla Atmos 7.1.4',  category: 'mezcla',    rate: 15000, unit: 'proyecto', room: 'atmos', atmos: true,  active: true },
  { name: 'Mezcla Estéreo',      category: 'mezcla',    rate: 5000,  unit: 'canción',  room: 'atmos', atmos: false, active: true },
  { name: 'Masterización',       category: 'mastering', rate: 3500,  unit: 'track',    room: 'atmos', atmos: false, active: true },
  { name: 'Renta del estudio',   category: 'renta',     rate: 8000,  unit: 'día',      room: 'live',  atmos: false, active: true },
];

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'deposit' | 'paid' | 'overdue';

export type Booking = {
  id: string;
  clientId?: string;
  clientName: string;
  project?: string;
  serviceId?: string;
  serviceName: string;
  date: string;      // ISO yyyy-mm-dd
  time: string;      // HH:00
  duration: number;  // hours
  amount: number;    // MXN
  deposit: number;   // MXN received
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  room: RoomId;
  notes?: string;
  accent: AvatarAccent;
  createdAt: string;
};

export type PostStatus = 'draft' | 'published';

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;          // plain text; blank lines = paragraphs
  cover?: string;        // resized JPEG data-URL
  tags: string[];
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export type RequestStatus = 'new' | 'reviewed' | 'converted' | 'discarded';

export type WebRequest = {
  id: string;
  name: string;
  email: string;
  project?: string;
  service?: string;
  message?: string;
  status: RequestStatus;
  createdAt: string;
  source: 'web' | 'manual';
};

export type Activity = {
  id: string;
  actor?: string;
  text: string;
  at: string; // ISO
  tone: AvatarAccent;
};

export type StoreData = {
  version: 1;
  users: UserAccount[];
  clients: Client[];
  services: Service[];
  bookings: Booking[];
  posts: BlogPost[];
  requests: WebRequest[];
  activities: Activity[];
};

export const EMPTY_STORE: StoreData = {
  version: 1,
  users: [],
  clients: [],
  services: [],
  bookings: [],
  posts: [],
  requests: [],
  activities: [],
};

/* ─────────────────────────────────────────────────────────────────────────
 * Persistence
 * ───────────────────────────────────────────────────────────────────────── */

export const STORE_KEY = 'malonic-admin-store-v1';
export const SESSION_KEY = 'malonic-admin-session';

const safeStorage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Parse + normalize whatever is on disk; never throws. */
export function normalizeStore(raw: unknown): StoreData {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_STORE };
  const r = raw as Record<string, unknown>;
  return {
    version: 1,
    users: asArray<UserAccount>(r.users),
    clients: asArray<Client>(r.clients),
    services: asArray<Service>(r.services),
    bookings: asArray<Booking>(r.bookings),
    posts: asArray<BlogPost>(r.posts),
    requests: asArray<WebRequest>(r.requests),
    activities: asArray<Activity>(r.activities),
  };
}

export function loadStore(): StoreData {
  const ls = safeStorage();
  if (!ls) return { ...EMPTY_STORE };
  try {
    const raw = ls.getItem(STORE_KEY);
    if (!raw) return { ...EMPTY_STORE };
    return normalizeStore(JSON.parse(raw));
  } catch {
    return { ...EMPTY_STORE };
  }
}

/** Returns false when the write failed (quota / privacy mode). */
export function persistStore(data: StoreData): boolean {
  const ls = safeStorage();
  if (!ls) return false;
  try {
    ls.setItem(STORE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Bytes currently used by the store document. */
export function storeSizeBytes(): number {
  const ls = safeStorage();
  if (!ls) return 0;
  try {
    return new Blob([ls.getItem(STORE_KEY) ?? '']).size;
  } catch {
    return 0;
  }
}

/** Rough localStorage budget — browsers give ~5 MB per origin. */
export const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024;

/** Cross-tab sync: fires when another tab (e.g. the public site) writes the store. */
export function onStoreChanged(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key === STORE_KEY) fn();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Ids, dates, formatting
 * ───────────────────────────────────────────────────────────────────────── */

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export const nowISO = (): string => new Date().toISOString();

export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatMXN = (n: number): string =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(n);

export const formatDateMX = (iso: string): string => {
  const [, mm, dd] = iso.split('-');
  return dd && mm ? `${dd}/${mm}` : iso;
};

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const formatDateLongMX = (iso: string): string => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
};

export const relativeTime = (iso: string): string => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Ayer';
  if (d < 30) return `Hace ${d} días`;
  return formatDateLongMX(iso.slice(0, 10));
};

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

export const parseHour = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
};

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post';

/* ─────────────────────────────────────────────────────────────────────────
 * Calendar weeks (Mon–Sun, dynamic — the admin lives in the present)
 * ───────────────────────────────────────────────────────────────────────── */

export type CalDay = { key: string; label: string; date: number; isToday: boolean };

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const toKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function weekDaysFor(offsetWeeks = 0): CalDay[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  const todayKey = toKey(new Date());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = toKey(d);
    return { key, label: DAY_LABELS[i], date: d.getDate(), isToday: key === todayKey };
  });
}

export function weekLabelFor(days: CalDay[]): string {
  const first = new Date(`${days[0].key}T12:00:00`);
  const last = new Date(`${days[6].key}T12:00:00`);
  const sameMonth = first.getMonth() === last.getMonth();
  const m1 = MONTHS_ES[first.getMonth()];
  const m2 = MONTHS_ES[last.getMonth()];
  return sameMonth
    ? `${first.getDate()} – ${last.getDate()} ${m1} ${last.getFullYear()}`
    : `${first.getDate()} ${m1} – ${last.getDate()} ${m2} ${last.getFullYear()}`;
}

export const CAL_START_HOUR = 8;
export const CAL_END_HOUR = 22;

/* ─────────────────────────────────────────────────────────────────────────
 * Derived metrics — all pure over the live arrays
 * ───────────────────────────────────────────────────────────────────────── */

export const balanceOf = (b: Booking): number =>
  b.status === 'cancelled' || b.paymentStatus === 'paid' ? 0 : b.amount - b.deposit;

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

export const depositsHeldOf = (list: Booking[]): number =>
  list.filter((b) => b.status === 'confirmed').reduce((acc, b) => acc + b.deposit, 0);

export const avgTicketOf = (list: Booking[]): number => {
  const active = list.filter((b) => b.status !== 'cancelled');
  if (active.length === 0) return 0;
  return Math.round(active.reduce((acc, b) => acc + b.amount, 0) / active.length);
};

const isBilled = (b: Booking) => b.status === 'confirmed' || b.status === 'completed';

/** Facturación estimada por mes (últimos `months`), de reservas confirmadas/completadas. */
export function monthlyRevenueOf(list: Booking[], months = 6): { month: string; key: string; revenue: number }[] {
  const out: { month: string; key: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ month: MONTHS_ES[d.getMonth()], key, revenue: 0 });
  }
  for (const b of list) {
    if (!isBilled(b)) continue;
    const key = b.date.slice(0, 7);
    const slot = out.find((m) => m.key === key);
    if (slot) slot.revenue += b.amount;
  }
  return out;
}

export const monthRevenueOf = (list: Booking[]): number => {
  const key = todayISO().slice(0, 7);
  return list.filter((b) => isBilled(b) && b.date.slice(0, 7) === key).reduce((a, b) => a + b.amount, 0);
};

export function revenueByServiceOf(list: Booking[]): { name: string; revenue: number; atmos: boolean }[] {
  const map = new Map<string, { name: string; revenue: number; atmos: boolean }>();
  for (const b of list) {
    if (!isBilled(b)) continue;
    const entry = map.get(b.serviceName) ?? { name: b.serviceName, revenue: 0, atmos: /atmos/i.test(b.serviceName) };
    entry.revenue += b.amount;
    map.set(b.serviceName, entry);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export function hoursByRoomOf(list: Booking[]): { room: Room; hours: number }[] {
  return ROOMS.map((room) => ({
    room,
    hours: list
      .filter((b) => b.room === room.id && b.status !== 'cancelled')
      .reduce((acc, b) => acc + b.duration, 0),
  }));
}

export function statusCountsOf(list: Booking[]): Record<BookingStatus, number> {
  const out: Record<BookingStatus, number> = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  for (const b of list) out[b.status] += 1;
  return out;
}

export function topClientsOf(list: Booking[], limit = 5): { name: string; revenue: number; sessions: number }[] {
  const map = new Map<string, { name: string; revenue: number; sessions: number }>();
  for (const b of list) {
    if (b.status === 'cancelled') continue;
    const entry = map.get(b.clientName) ?? { name: b.clientName, revenue: 0, sessions: 0 };
    entry.revenue += b.amount;
    entry.sessions += 1;
    map.set(b.clientName, entry);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function weekHoursOf(list: Booking[], days: CalDay[]): { day: string; hours: number }[] {
  return days.map((d) => ({
    day: d.label,
    hours: list
      .filter((b) => b.date === d.key && b.status !== 'cancelled')
      .reduce((acc, b) => acc + b.duration, 0),
  }));
}

export function clientStatsOf(list: Booking[], client: Client): { sessions: number; revenue: number; lastVisit?: string } {
  const own = list.filter(
    (b) => b.status !== 'cancelled' && (b.clientId === client.id || b.clientName.toLowerCase() === client.name.toLowerCase()),
  );
  const lastVisit = own.map((b) => b.date).sort().at(-1);
  return {
    sessions: own.length,
    revenue: own.reduce((acc, b) => acc + b.amount, 0),
    lastVisit,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Auth — SHA-256(salt + password) via Web Crypto.
 * NOTE: gating only. Data lives client-side; real multi-user security
 * arrives with the backend phase.
 * ───────────────────────────────────────────────────────────────────────── */

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const makeSalt = (): string => uid().replace(/-/g, '').slice(0, 16);

export async function verifyPassword(password: string, user: UserAccount): Promise<boolean> {
  const h = await hashPassword(password, user.salt);
  return h === user.passHash;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Images — downscale to keep the localStorage budget sane.
 * ───────────────────────────────────────────────────────────────────────── */

export function resizeImageToDataURL(file: File, maxSide = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas unavailable'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
}

/* ─────────────────────────────────────────────────────────────────────────
 * Public-site bridges (no React; safe to call from marketing pages)
 * ───────────────────────────────────────────────────────────────────────── */

export function submitWebRequest(input: {
  name: string;
  email: string;
  project?: string;
  service?: string;
  message?: string;
}): boolean {
  const store = loadStore();
  const req: WebRequest = {
    id: uid(),
    name: input.name.trim(),
    email: input.email.trim(),
    project: input.project?.trim() || undefined,
    service: input.service || undefined,
    message: input.message?.trim() || undefined,
    status: 'new',
    createdAt: nowISO(),
    source: 'web',
  };
  const activity: Activity = {
    id: uid(),
    actor: req.name,
    text: 'envió una solicitud desde el sitio web.',
    at: req.createdAt,
    tone: 'brass',
  };
  store.requests = [req, ...store.requests];
  store.activities = [activity, ...store.activities].slice(0, 60);
  return persistStore(store);
}

export const getPublishedPosts = (): BlogPost[] =>
  loadStore()
    .posts.filter((p) => p.status === 'published')
    .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt));

export const findPostBySlug = (slug: string): BlogPost | undefined =>
  getPublishedPosts().find((p) => p.slug === slug);

/* ─────────────────────────────────────────────────────────────────────────
 * Backup
 * ───────────────────────────────────────────────────────────────────────── */

export function exportStoreJSON(): string {
  return JSON.stringify({ exportedAt: nowISO(), ...loadStore() }, null, 2);
}

/** Throws with a readable message when the file isn't a Malonic backup. */
export function importStoreJSON(json: string): StoreData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('El archivo no es JSON válido.');
  }
  const r = parsed as Record<string, unknown>;
  if (!r || typeof r !== 'object' || r.version !== 1 || !Array.isArray(r.users)) {
    throw new Error('El archivo no parece un respaldo de Malonic CRM (versión 1).');
  }
  const store = normalizeStore(parsed);
  if (!persistStore(store)) throw new Error('No se pudo guardar el respaldo (almacenamiento lleno).');
  return store;
}
