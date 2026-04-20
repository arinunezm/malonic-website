/* Shared motion tokens — keep parity with index.css cubic-béziers */

import type { Variants } from 'motion/react';

export const ease = {
  primary: [0.65, 0, 0.35, 1] as const,
  reveal: [0.77, 0, 0.175, 1] as const,
  outQuad: [0.25, 0.46, 0.45, 0.94] as const,
  outExpo: [0.16, 1, 0.3, 1] as const,
};

export const dur = {
  xs: 0.2,
  sm: 0.4,
  md: 0.8,
  lg: 1.4,
  xl: 2.0,
};

/* Common variants — the staples we use everywhere */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.md, ease: ease.outExpo },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: dur.md, ease: ease.outExpo },
  },
};

export const stagger = (delay = 0.06): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: delay,
      delayChildren: 0.05,
    },
  },
});

export const lineMask: Variants = {
  hidden: { y: '110%' },
  visible: {
    y: '0%',
    transition: { duration: dur.lg, ease: ease.reveal },
  },
};
