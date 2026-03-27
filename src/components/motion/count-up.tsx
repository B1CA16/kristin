'use client';

import { useEffect, useRef } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion';

type CountUpProps = {
  target: number;
  className?: string;
};

/**
 * Animated counter that counts from 0 to target when scrolled into view.
 */
export function CountUp({ target, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));

  useEffect(() => {
    if (!isInView || reduced) {
      motionValue.set(target);
      return;
    }

    const controls = animate(motionValue, target, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    });

    return controls.stop;
  }, [isInView, target, motionValue, reduced]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}
