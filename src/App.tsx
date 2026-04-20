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

import React, { useEffect, useState } from 'react';
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

export default function App() {
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
