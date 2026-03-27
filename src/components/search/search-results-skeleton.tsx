import { cn } from '@/lib/utils';

/**
 * Skeleton loading state for the search results grid.
 * Matches MediaGrid column layout with rounded-2xl placeholder cards.
 */
export function SearchResultsSkeleton() {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3',
        'min-[475px]:grid-cols-3',
        'sm:grid-cols-4 sm:gap-4',
        'md:grid-cols-5',
        'lg:grid-cols-6',
      )}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-2xl">
          <div className="bg-muted aspect-2/3 w-full animate-pulse" />
          <div className="flex flex-col gap-1.5 p-2.5">
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded-lg" />
            <div className="bg-muted h-3 w-1/3 animate-pulse rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
