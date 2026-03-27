'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type ScrollHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Wrapper for the navbar that adds a subtle shadow
 * when the page is scrolled past a threshold.
 */
export function ScrollHeader({ children, className }: ScrollHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        className,
        'transition-shadow duration-300',
        scrolled && 'shadow-md',
      )}
    >
      {children}
    </header>
  );
}
