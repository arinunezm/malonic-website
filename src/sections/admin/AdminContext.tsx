/**
 * AdminContext — single provider for the CRM shell.
 * Holds the store document in React state; every mutation persists to
 * localStorage and (optionally) logs an activity entry. Cross-tab writes
 * (public booking form in another tab) re-hydrate via the storage event.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadStore,
  onStoreChanged,
  persistStore,
  uid,
  nowISO,
  hashPassword,
  makeSalt,
  verifyPassword,
  SESSION_KEY,
  BASE_CATALOG,
  type Activity,
  type AvatarAccent,
  type BlogPost,
  type Booking,
  type Client,
  type Role,
  type Service,
  type StoreData,
  type UserAccount,
  type WebRequest,
  type RequestStatus,
} from '../../lib/admin-store';

export type PageId =
  | 'dashboard'
  | 'requests'
  | 'bookings'
  | 'calendar'
  | 'clients'
  | 'blog'
  | 'analytics'
  | 'services'
  | 'users'
  | 'data';

export const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Panel general',
  requests: 'Solicitudes',
  bookings: 'Reservaciones',
  calendar: 'Calendario',
  clients: 'Clientes',
  blog: 'Blog',
  analytics: 'Analítica',
  services: 'Servicios & tarifas',
  users: 'Usuarios',
  data: 'Datos & respaldo',
};

const ACCENT_CYCLE: AvatarAccent[] = ['signal', 'brass', 'pearl', 'paper'];
let accentSeq = 0;
export const nextAccent = (): AvatarAccent => ACCENT_CYCLE[accentSeq++ % ACCENT_CYCLE.length];

export type BookingDraft = {
  id?: string;
  clientId?: string;
  clientName: string;
  project?: string;
  serviceId?: string;
  date?: string;
  time?: string;
  duration?: number;
  deposit?: number;
  notes?: string;
  requestId?: string; // when converting a web request
};

type AdminState = {
  store: StoreData;
  currentUser: UserAccount | null;

  page: PageId;
  setPage: (p: PageId) => void;
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
  notify: (message: string) => void;
  toast: string | null;

  bookingModal: BookingDraft | null;
  openBookingModal: (draft?: BookingDraft) => void;
  closeBookingModal: () => void;

  // auth
  setupAdmin: (name: string, username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  // bookings
  saveBooking: (draft: BookingDraft & { serviceId: string; date: string; time: string; duration: number; deposit: number; saveClient?: boolean }) => void;
  setBookingStatus: (id: string, status: Booking['status']) => void;
  setBookingPayment: (id: string, payment: Booking['paymentStatus'], deposit?: number) => void;
  deleteBooking: (id: string) => void;

  // clients
  saveClient: (c: Partial<Client> & { name: string }) => Client;
  deleteClient: (id: string) => void;

  // services
  saveService: (s: Partial<Service> & { name: string; rate: number }) => void;
  deleteService: (id: string) => void;
  loadBaseCatalog: () => void;

  // posts
  savePost: (p: Partial<BlogPost> & { title: string; body: string }) => BlogPost;
  setPostStatus: (id: string, status: BlogPost['status']) => void;
  deletePost: (id: string) => void;

  // requests
  setRequestStatus: (id: string, status: RequestStatus) => void;

  // users
  addUser: (name: string, username: string, password: string, role: Role) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (userId: string, password: string) => Promise<void>;
  deleteUser: (userId: string) => { ok: boolean; error?: string };

  // backup
  replaceStore: (data: StoreData) => void;
};

const AdminContext = createContext<AdminState | null>(null);

export function useAdmin(): AdminState {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}

const readSession = (): string | null => {
  try {
    return window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};
const writeSession = (id: string | null) => {
  try {
    if (id) window.sessionStorage.setItem(SESSION_KEY, id);
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch { /* in-memory only */ }
};

export function AdminProvider({ children, onLocked }: { children: React.ReactNode; onLocked: () => void }) {
  const [store, setStore] = useState<StoreData>(() => loadStore());
  const [sessionUserId, setSessionUserId] = useState<string | null>(() => readSession());
  const [page, setPage] = useState<PageId>('dashboard');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState<BookingDraft | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 550);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Re-hydrate when the public site (another tab) writes a request.
  useEffect(() => onStoreChanged(() => setStore(loadStore())), []);

  const currentUser = useMemo(
    () => store.users.find((u) => u.id === sessionUserId) ?? null,
    [store.users, sessionUserId],
  );

  /** All mutations flow through here: update → persist → optional activity. */
  const mutate = useCallback(
    (fn: (s: StoreData) => StoreData, activity?: Omit<Activity, 'id' | 'at'>) => {
      setStore((prev) => {
        let next = fn(prev);
        if (activity) {
          next = {
            ...next,
            activities: [{ id: uid(), at: nowISO(), ...activity }, ...next.activities].slice(0, 60),
          };
        }
        if (!persistStore(next)) {
          window.setTimeout(
            () => setToast('⚠ Almacenamiento lleno — exporta un respaldo y libera espacio'),
            0,
          );
        }
        return next;
      });
    },
    [],
  );

  /* ── auth ─────────────────────────────────────────────────────────── */

  const setupAdmin = useCallback(
    async (name: string, username: string, password: string) => {
      const salt = makeSalt();
      const passHash = await hashPassword(password, salt);
      const user: UserAccount = {
        id: uid(),
        name: name.trim(),
        username: username.trim().toLowerCase(),
        passHash,
        salt,
        role: 'admin',
        createdAt: nowISO(),
      };
      mutate(
        (s) => ({ ...s, users: [...s.users, user] }),
        { actor: user.name, text: 'creó la cuenta de administrador.', tone: 'signal' },
      );
      writeSession(user.id);
      setSessionUserId(user.id);
    },
    [mutate],
  );

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const user = store.users.find((u) => u.username === username.trim().toLowerCase());
      if (!user) return false;
      const ok = await verifyPassword(password, user);
      if (!ok) return false;
      writeSession(user.id);
      setSessionUserId(user.id);
      return true;
    },
    [store.users],
  );

  const logout = useCallback(() => {
    writeSession(null);
    setSessionUserId(null);
    setPage('dashboard');
    setQuery('');
    onLocked();
  }, [onLocked]);

  /* ── bookings ─────────────────────────────────────────────────────── */

  const saveBooking = useCallback<AdminState['saveBooking']>(
    (draft) => {
      mutate((s) => {
        const service = s.services.find((sv) => sv.id === draft.serviceId);
        const serviceName = service?.name ?? 'Servicio';
        const rate = service?.rate ?? 0;
        const perTime = service?.unit === 'hora';
        const amount = perTime ? rate * draft.duration : rate;
        const deposit = Math.max(0, Math.min(draft.deposit, amount));

        let clients = s.clients;
        let clientId = draft.clientId;
        if (!clientId && draft.saveClient) {
          const existing = s.clients.find((c) => c.name.toLowerCase() === draft.clientName.trim().toLowerCase());
          if (existing) {
            clientId = existing.id;
          } else {
            const c: Client = {
              id: uid(),
              name: draft.clientName.trim(),
              accent: nextAccent(),
              createdAt: nowISO(),
            };
            clients = [c, ...clients];
            clientId = c.id;
          }
        }

        const base: Booking = {
          id: draft.id ?? uid(),
          clientId,
          clientName: draft.clientName.trim(),
          project: draft.project?.trim() || undefined,
          serviceId: draft.serviceId,
          serviceName,
          date: draft.date,
          time: draft.time,
          duration: draft.duration,
          amount,
          deposit,
          status: deposit > 0 ? 'confirmed' : 'pending',
          paymentStatus: deposit >= amount && amount > 0 ? 'paid' : deposit > 0 ? 'deposit' : 'pending',
          room: service?.room ?? 'atmos',
          notes: draft.notes?.trim() || undefined,
          accent: nextAccent(),
          createdAt: nowISO(),
        };

        let bookings: Booking[];
        if (draft.id) {
          bookings = s.bookings.map((b) =>
            b.id === draft.id
              ? { ...base, status: b.status === 'completed' || b.status === 'cancelled' ? b.status : base.status, accent: b.accent, createdAt: b.createdAt }
              : b,
          );
        } else {
          bookings = [base, ...s.bookings];
        }

        let requests = s.requests;
        if (draft.requestId) {
          requests = s.requests.map((r) => (r.id === draft.requestId ? { ...r, status: 'converted' as const } : r));
        }

        return { ...s, bookings, clients, requests };
      }, {
        actor: draft.clientName.trim(),
        text: draft.id ? 'reservación actualizada.' : `nueva reservación · ${draft.date}.`,
        tone: 'signal',
      });
      setToast(draft.id ? 'Reservación actualizada' : 'Reservación creada');
      setBookingModal(null);
    },
    [mutate],
  );

  const setBookingStatus = useCallback<AdminState['setBookingStatus']>(
    (id, status) => {
      mutate((s) => ({
        ...s,
        bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
      }));
      setToast('Estado actualizado');
    },
    [mutate],
  );

  const setBookingPayment = useCallback<AdminState['setBookingPayment']>(
    (id, payment, deposit) => {
      mutate((s) => ({
        ...s,
        bookings: s.bookings.map((b) =>
          b.id === id
            ? {
                ...b,
                paymentStatus: payment,
                deposit: payment === 'paid' ? b.amount : deposit !== undefined ? Math.max(0, Math.min(deposit, b.amount)) : b.deposit,
              }
            : b,
        ),
      }));
      setToast('Pago actualizado');
    },
    [mutate],
  );

  const deleteBooking = useCallback<AdminState['deleteBooking']>(
    (id) => {
      mutate((s) => ({ ...s, bookings: s.bookings.filter((b) => b.id !== id) }));
      setToast('Reservación eliminada');
    },
    [mutate],
  );

  /* ── clients ──────────────────────────────────────────────────────── */

  const saveClient = useCallback<AdminState['saveClient']>(
    (c) => {
      const saved: Client = {
        id: c.id ?? uid(),
        name: c.name.trim(),
        artist: c.artist?.trim() || undefined,
        genre: c.genre?.trim() || undefined,
        email: c.email?.trim() || undefined,
        phone: c.phone?.trim() || undefined,
        notes: c.notes?.trim() || undefined,
        accent: (c.accent as AvatarAccent) ?? nextAccent(),
        createdAt: c.createdAt ?? nowISO(),
      };
      mutate(
        (s) => ({
          ...s,
          clients: c.id ? s.clients.map((x) => (x.id === c.id ? saved : x)) : [saved, ...s.clients],
        }),
        c.id ? undefined : { actor: saved.name, text: 'agregado al directorio de clientes.', tone: 'pearl' },
      );
      setToast(c.id ? 'Cliente actualizado' : 'Cliente agregado');
      return saved;
    },
    [mutate],
  );

  const deleteClient = useCallback<AdminState['deleteClient']>(
    (id) => {
      mutate((s) => ({
        ...s,
        clients: s.clients.filter((c) => c.id !== id),
        bookings: s.bookings.map((b) => (b.clientId === id ? { ...b, clientId: undefined } : b)),
      }));
      setToast('Cliente eliminado');
    },
    [mutate],
  );

  /* ── services ─────────────────────────────────────────────────────── */

  const saveService = useCallback<AdminState['saveService']>(
    (svc) => {
      const saved: Service = {
        id: svc.id ?? uid(),
        name: svc.name.trim(),
        category: svc.category ?? 'grabacion',
        rate: Math.max(0, Math.round(svc.rate)),
        unit: svc.unit ?? 'hora',
        room: svc.room ?? 'atmos',
        atmos: svc.atmos ?? false,
        active: svc.active ?? true,
      };
      mutate(
        (s) => ({
          ...s,
          services: svc.id ? s.services.map((x) => (x.id === svc.id ? saved : x)) : [...s.services, saved],
        }),
        {
          text: svc.id
            ? `tarifa de ${saved.name} actualizada a $${saved.rate.toLocaleString('es-MX')}/${saved.unit}.`
            : `servicio ${saved.name} agregado al catálogo.`,
          tone: 'paper',
        },
      );
      setToast(svc.id ? 'Servicio actualizado' : 'Servicio creado');
    },
    [mutate],
  );

  const deleteService = useCallback<AdminState['deleteService']>(
    (id) => {
      mutate((s) => ({ ...s, services: s.services.filter((x) => x.id !== id) }));
      setToast('Servicio eliminado');
    },
    [mutate],
  );

  const loadBaseCatalog = useCallback(() => {
    mutate(
      (s) => ({
        ...s,
        services: [...s.services, ...BASE_CATALOG.map((b) => ({ ...b, id: uid() }))],
      }),
      { text: 'catálogo base Malonic cargado (5 servicios).', tone: 'paper' },
    );
    setToast('Catálogo base cargado — edita tarifas a gusto');
  }, [mutate]);

  /* ── posts ────────────────────────────────────────────────────────── */

  const savePost = useCallback<AdminState['savePost']>(
    (p) => {
      const now = nowISO();
      const existing = p.id ? store.posts.find((x) => x.id === p.id) : undefined;
      const saved: BlogPost = {
        id: p.id ?? uid(),
        title: p.title.trim(),
        slug: p.slug ?? existing?.slug ?? '',
        excerpt: p.excerpt?.trim() ?? '',
        body: p.body,
        cover: p.cover === undefined ? existing?.cover : p.cover || undefined,
        tags: p.tags ?? existing?.tags ?? [],
        status: p.status ?? existing?.status ?? 'draft',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        publishedAt: existing?.publishedAt,
      };
      mutate((s) => ({
        ...s,
        posts: p.id ? s.posts.map((x) => (x.id === p.id ? saved : x)) : [saved, ...s.posts],
      }));
      setToast(p.id ? 'Entrada guardada' : 'Borrador creado');
      return saved;
    },
    [mutate, store.posts],
  );

  const setPostStatus = useCallback<AdminState['setPostStatus']>(
    (id, status) => {
      mutate(
        (s) => ({
          ...s,
          posts: s.posts.map((x) =>
            x.id === id
              ? { ...x, status, publishedAt: status === 'published' ? x.publishedAt ?? nowISO() : x.publishedAt, updatedAt: nowISO() }
              : x,
          ),
        }),
        status === 'published'
          ? { text: 'entrada de blog publicada en el sitio.', tone: 'signal' }
          : undefined,
      );
      setToast(status === 'published' ? 'Publicado en malonicrecords /blog' : 'Movido a borradores');
    },
    [mutate],
  );

  const deletePost = useCallback<AdminState['deletePost']>(
    (id) => {
      mutate((s) => ({ ...s, posts: s.posts.filter((x) => x.id !== id) }));
      setToast('Entrada eliminada');
    },
    [mutate],
  );

  /* ── requests ─────────────────────────────────────────────────────── */

  const setRequestStatus = useCallback<AdminState['setRequestStatus']>(
    (id, status) => {
      mutate((s) => ({
        ...s,
        requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)),
      }));
    },
    [mutate],
  );

  /* ── users ────────────────────────────────────────────────────────── */

  const addUser = useCallback<AdminState['addUser']>(
    async (name, username, password, role) => {
      const uname = username.trim().toLowerCase();
      if (store.users.some((u) => u.username === uname)) {
        return { ok: false, error: 'Ese usuario ya existe.' };
      }
      const salt = makeSalt();
      const passHash = await hashPassword(password, salt);
      const user: UserAccount = { id: uid(), name: name.trim(), username: uname, passHash, salt, role, createdAt: nowISO() };
      mutate(
        (s) => ({ ...s, users: [...s.users, user] }),
        { actor: user.name, text: `cuenta ${role === 'admin' ? 'de administrador' : 'de staff'} creada.`, tone: 'pearl' },
      );
      setToast(`Usuario ${user.username} creado`);
      return { ok: true };
    },
    [mutate, store.users],
  );

  const resetPassword = useCallback<AdminState['resetPassword']>(
    async (userId, password) => {
      const salt = makeSalt();
      const passHash = await hashPassword(password, salt);
      mutate((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === userId ? { ...u, salt, passHash } : u)),
      }));
      setToast('Contraseña actualizada');
    },
    [mutate],
  );

  const deleteUser = useCallback<AdminState['deleteUser']>(
    (userId) => {
      if (userId === currentUser?.id) return { ok: false, error: 'No puedes eliminar tu propia cuenta.' };
      const target = store.users.find((u) => u.id === userId);
      if (!target) return { ok: false, error: 'Usuario no encontrado.' };
      const admins = store.users.filter((u) => u.role === 'admin');
      if (target.role === 'admin' && admins.length <= 1) {
        return { ok: false, error: 'Debe existir al menos un administrador.' };
      }
      mutate((s) => ({ ...s, users: s.users.filter((u) => u.id !== userId) }));
      setToast('Usuario eliminado');
      return { ok: true };
    },
    [mutate, store.users, currentUser],
  );

  /* ── backup ───────────────────────────────────────────────────────── */

  const replaceStore = useCallback((data: StoreData) => {
    setStore(data);
    setToast('Respaldo restaurado');
  }, []);

  const value: AdminState = {
    store,
    currentUser,
    page,
    setPage,
    query,
    setQuery,
    loading,
    notify: setToast,
    toast,
    bookingModal,
    openBookingModal: (draft) => setBookingModal(draft ?? { clientName: '' }),
    closeBookingModal: () => setBookingModal(null),
    setupAdmin,
    login,
    logout,
    saveBooking,
    setBookingStatus,
    setBookingPayment,
    deleteBooking,
    saveClient,
    deleteClient,
    saveService,
    deleteService,
    loadBaseCatalog,
    savePost,
    setPostStatus,
    deletePost,
    setRequestStatus,
    addUser,
    resetPassword,
    deleteUser,
    replaceStore,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
