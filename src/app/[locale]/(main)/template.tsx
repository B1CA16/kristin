'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { DURATION, EASE } from '@/lib/motion';

/**
 * Template wraps each page with a fade-in entrance animation.
 * Next.js re-mounts templates on navigation, triggering the animation.
 * Exit animations are not possible with the App Router template approach,
 * but the entrance fade gives pages a polished feel.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE.smooth }}
    >
      {children}
    </motion.div>
  );
}
