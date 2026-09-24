/**
 * Centralized motion tokens for the landing page.
 *
 * Keep durations/easings/variants here instead of hardcoding values in
 * components, so the motion language stays consistent if it needs to
 * expand to other sections later.
 */
import type { Transition, Variants } from "motion/react";

export const duration = {
  micro: 0.15,
  fast: 0.2,
  normal: 0.35,
  emphasis: 0.6,
} as const;

export const easing = {
  out: [0.16, 1, 0.3, 1] as const, // confident ease-out for entrances
  inOut: [0.65, 0, 0.35, 1] as const,
};

export const spring = {
  standard: { type: "spring", stiffness: 400, damping: 32 } satisfies Transition,
  soft: { type: "spring", stiffness: 300, damping: 30 } satisfies Transition,
  snappy: { type: "spring", stiffness: 500, damping: 35 } satisfies Transition,
};

/** Fade + rise entrance for hero copy, used with staggerChildren on the parent. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.out },
  },
};

/** Parent container that staggers fadeUp children in on mount. */
export const staggerContainer = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

/** Scroll-triggered reveal for content entering the viewport (fires once). */
export const revealUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.emphasis, ease: easing.out },
  },
};

export const viewportOnce = { once: true, margin: "-80px" } as const;
