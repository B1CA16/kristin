'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { slideUp, viewportOnce } from '@/lib/motion';

type SlideUpProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function SlideUp({ children, className, delay }: SlideUpProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={slideUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </motion.div>
  );
}
