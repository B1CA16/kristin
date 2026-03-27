import type { Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

export const DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  entrance: 0.6,
} as const;

export const EASE = {
  /** Snappy spring — for entrances */
  spring: [0.22, 1, 0.36, 1] as const,
  /** Slight overshoot — for playful bounces */
  bounce: [0.34, 1.56, 0.64, 1] as const,
  /** Smooth decel — for fades */
  smooth: [0.4, 0, 0.2, 1] as const,
};

export const STAGGER_DELAY = 0.08;

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.entrance, ease: EASE.smooth },
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.entrance, ease: EASE.spring },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.entrance, ease: EASE.spring },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: STAGGER_DELAY },
  },
};

// ---------------------------------------------------------------------------
// Viewport defaults for whileInView
// ---------------------------------------------------------------------------

export const viewportOnce = { once: true, amount: 0.2 } as const;
