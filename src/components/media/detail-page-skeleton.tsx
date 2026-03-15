/**
 * Skeleton loading state for movie/TV detail pages.
 * Mirrors the MediaHero + content sections layout.
 */
export function DetailPageSkeleton() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="relative">
        {/* Backdrop */}
        <div className="bg-muted h-[300px] w-full animate-pulse sm:h-[400px] md:h-[450px]" />

        {/* Content overlay */}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="-mt-32 flex flex-col gap-6 sm:-mt-40 sm:flex-row sm:gap-8">
            {/* Poster */}
            <div className="mx-auto w-[160px] shrink-0 sm:mx-0 sm:w-[200px] md:w-[240px]">
              <div className="bg-muted aspect-2/3 w-full animate-pulse rounded-lg" />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col justify-end gap-3 pb-2">
              <div className="bg-muted h-8 w-2/3 animate-pulse rounded" />
              <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
              <div className="flex gap-2">
                <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                <div className="bg-muted h-4 w-12 animate-pulse rounded" />
              </div>
              <div className="mt-1 flex gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted h-6 w-16 animate-pulse rounded-full"
                  />
                ))}
              </div>
              <div className="mt-2 space-y-2">
                <div className="bg-muted h-4 w-full animate-pulse rounded" />
                <div className="bg-muted h-4 w-full animate-pulse rounded" />
                <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content sections skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10">
          {/* Primary column — recommendations skeleton */}
          <section>
            {/* Tab header skeleton */}
            <div className="border-border mb-6 flex gap-4 border-b pb-2">
              <div className="bg-muted h-5 w-32 animate-pulse rounded" />
              <div className="bg-muted h-5 w-24 animate-pulse rounded" />
            </div>
            {/* Suggestion cards skeleton */}
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card ring-border flex gap-3 rounded-lg p-3 ring-1"
                >
                  <div className="bg-muted size-10 animate-pulse rounded-md" />
                  <div className="bg-muted h-[72px] w-12 animate-pulse rounded" />
                  <div className="flex flex-1 flex-col justify-center gap-1.5">
                    <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
                    <div className="bg-muted h-3 w-full animate-pulse rounded" />
                    <div className="bg-muted h-3 w-1/4 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sidebar skeleton */}
          <aside className="mt-10 space-y-10 lg:mt-0">
            {/* Cast skeleton */}
            <section>
              <div className="bg-muted mb-4 h-6 w-20 animate-pulse rounded" />
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-[120px] shrink-0 sm:w-[140px]">
                    <div className="bg-muted aspect-2/3 w-full animate-pulse rounded-lg" />
                    <div className="mt-1.5 space-y-1">
                      <div className="bg-muted h-3.5 w-3/4 animate-pulse rounded" />
                      <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Watch providers skeleton */}
            <section>
              <div className="bg-muted mb-4 h-6 w-32 animate-pulse rounded" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted size-10 animate-pulse rounded"
                  />
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
