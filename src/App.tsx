/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Malonic Records — flagship single-page experience.
 *
 * Architecture notes:
 * - Stack: React 19 + Vite + Tailwind v4 + motion (framer).
 * - Design tokens live in src/index.css under @theme + :root vars.
 * - All copy is bilingual via src/lib/i18n.tsx (ES default, persisted to localStorage).
 * - Each section is a self-contained file in src/sections/ and registers a body[data-theme]
 *   via the useSectionTheme hook so the page transitions colors as you scroll.
 * - Reveal patterns (text masks, image masks, magnetic CTAs, marquee, custom cursor) live in
 *   src/components/primitives.tsx.
 * - Smooth scrolling: we deliberately rely on native (CSS scroll-behavior + macOS native smooth
 *   wheel) instead of a Lenis-style fixed wrapper. Wrapping the content with a transformed
 *   container would conflict with the custom cursor's mix-blend-mode, the IntersectionObservers
 *   used for theme switching and reveals, and any future sticky positioning. The premium feel
 *   comes from typography, the cursor and the reveal cadence — not from scroll inertia.
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';

import { LangProvider } from './lib/i18n';
import { Cursor, Grain, LoadingScreen, ScrollProgress } from './components/primitives';
import { Nav } from './components/Nav';

import { Hero } from './sections/Hero';
import { Manifesto } from './sections/Manifesto';
import { Studio } from './sections/Studio';
import { Equipment } from './sections/Equipment';
import { Services } from './sections/Services';
import { Catalogue } from './sections/Catalogue';
import { Booking } from './sections/Booking';
import { Footer } from './sections/Footer';

// CRM y blog en chunks lazy: los visitantes del sitio no descargan el admin
// (ni supabase-js cuando el modo nube esté activo).
const Admin = lazy(() => import('./sections/Admin').then((m) => ({ default: m.Admin })));
const BlogIndex = lazy(() => import('./sections/Blog').then((m) => ({ default: m.BlogIndex })));
const BlogPost = lazy(() => import('./sections/Blog').then((m) => ({ default: m.BlogPost })));

// Tiny pathname-based router. Avoids pulling in react-router for two shells.
type Route = { kind: 'site' } | { kind: 'admin' } | { kind: 'blog' } | { kind: 'post'; slug: string };

function parseRoute(pathname: string): Route {
  const p = pathname.replace(/\/+$/, '');
  if (p === '/admin') return { kind: 'admin' };
  if (p === '/blog') return { kind: 'blog' };
  const post = p.match(/^\/blog\/([^/]+)$/);
  if (post) return { kind: 'post', slug: decodeURIComponent(post[1]) };
  return { kind: 'site' };
}

function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? { kind: 'site' } : parseRoute(window.location.pathname),
  );
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  return route;
}

export default function App() {
  const route = useRoute();

  // /admin → CRM shell · /blog → journal. Both deliberately drop the
  // marketing loader, nav and scroll experience — they're inner pages.
  if (route.kind === 'admin') {
    return (
      <LangProvider>
        <Cursor />
        <Grain />
        <Suspense fallback={<ShellFallback />}>
          <Admin />
        </Suspense>
      </LangProvider>
    );
  }
  if (route.kind === 'blog' || route.kind === 'post') {
    return (
      <LangProvider>
        <Cursor />
        <Grain />
        <Suspense fallback={<ShellFallback />}>
          {route.kind === 'blog' ? <BlogIndex /> : <BlogPost slug={route.slug} />}
        </Suspense>
      </LangProvider>
    );
  }

  return <MarketingSite />;
}

/** Pantalla ink vacía mientras carga el chunk lazy (evita flash blanco). */
function ShellFallback() {
  return <div className="min-h-screen w-full" style={{ background: 'var(--color-ink)' }} aria-hidden />;
}

function MarketingSite() {
  const [loading, setLoading] = useState(true);

  // Lock scroll while the loader is up so the hero reveals from a clean state.
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [loading]);

  // Set initial theme so first-paint matches the hero.
  useEffect(() => {
    document.body.dataset.theme = 'dark';
  }, []);

  return (
    <LangProvider>
      <Cursor />
      <Grain />

      <AnimatePresence mode="wait">
        {loading && <LoadingScreen key="loader" onDone={() => setLoading(false)} />}
      </AnimatePresence>

      <ScrollProgress />
      <Nav />

      <main>
        <Hero />
        <Manifesto />
        <Studio />
        <Equipment />
        <Services />
        <Catalogue />
        <Booking />
      </main>

      <Footer />
    </LangProvider>
  );
}
