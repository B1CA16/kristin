import { cn } from '@/lib/utils';

type MediaGridProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Responsive grid layout for MediaCard items.
 *
 * Columns:
 * - Mobile (<475px): 2 columns
 * - Small (475–640px): 3 columns
 * - Tablet (640–768px): 4 columns
 * - Desktop (768–1024px): 5 columns
 * - Large (1024px+): 6 columns
 */
export function MediaGrid({ children, className }: MediaGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3',
        'min-[475px]:grid-cols-3',
        'sm:grid-cols-4 sm:gap-4',
        'md:grid-cols-5',
        'lg:grid-cols-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
