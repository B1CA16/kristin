'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, viewportOnce } from '@/lib/motion';

type StaggerContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** Override default stagger delay */
  staggerDelay?: number;
};

export function StaggerContainer({
  children,
  className,
  staggerDelay,
}: StaggerContainerProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const variants = staggerDelay
    ? {
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }
    : staggerContainer;

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {children}
    </motion.div>
  );
}
