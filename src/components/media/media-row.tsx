import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MediaRowProps = {
  title: string;
  /** Optional trailing element (e.g. day/week toggle) */
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Horizontal scrollable row of media cards with a section heading.
 * Used for compact trending/popular sections on the discover page.
 */
export function MediaRow({
  title,
  trailing,
  children,
  className,
}: MediaRowProps) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {trailing}
      </div>
      <div
        className={cn(
          'scrollbar-custom flex gap-3 overflow-x-auto pb-2',
          '[&>*]:w-[140px] [&>*]:shrink-0 sm:[&>*]:w-[160px]',
        )}
      >
        {children}
      </div>
    </section>
  );
}
