'use client';

import { motion } from 'framer-motion';
import { slideUp, scaleIn } from '@/lib/motion';

type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'slideUp' | 'scaleIn';
};

const variantMap = { slideUp, scaleIn };

export function StaggerItem({
  children,
  className,
  variant = 'slideUp',
}: StaggerItemProps) {
  return (
    <motion.div className={className} variants={variantMap[variant]}>
      {children}
    </motion.div>
  );
}
