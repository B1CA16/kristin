'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { usePathname } from '@/i18n/navigation';
import type {
  MovieListResult,
  MultiSearchResult,
  TVListResult,
} from '@/lib/tmdb/types';
import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
import { SearchResultsSkeleton } from './search-results-skeleton';

type SearchFilter = 'all' | 'movie' | 'tv';

type SearchResultsProps = {
  initialQuery: string;
  initialType: string;
};

/**
 * Full search results page with filter tabs and infinite scroll.
 * Syncs query and filter to URL search params.
 */
export function SearchResults({
  initialQuery,
  initialType,
}: SearchResultsProps) {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<SearchFilter>(
    isValidFilter(initialType) ? initialType : 'all',
  );
  const [results, setResults] = useState<MultiSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const hasMore = page < totalPages;

  // Fetch results
  const fetchResults = useCallback(
    async (
      searchQuery: string,
      searchFilter: SearchFilter,
      searchPage: number,
    ) => {
      if (!searchQuery || searchQuery.length < 2) return null;

      const params = new URLSearchParams({
        query: searchQuery,
        page: String(searchPage),
        locale,
      });
      if (searchFilter !== 'all') {
        params.set('type', searchFilter);
      }

      const res = await fetch(`/api/tmdb/search?${params}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      // Type-specific endpoints (movie/tv) don't include media_type in results.
      // Tag them so downstream filtering works uniformly.
      if (searchFilter !== 'all' && data.results) {
        data.results = data.results.map((r: Record<string, unknown>) =>
          r.media_type ? r : { ...r, media_type: searchFilter },
        );
      }

      return data;
    },
    [locale],
  );

  // Initial search and query/filter changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setHasSearched(false);
      router.replace(pathname, { scroll: false });
      return;
    }

    const controller = new AbortController();

    async function search() {
      setIsLoading(true);
      setPage(1);
      try {
        const data = await fetchResults(debouncedQuery, filter, 1);
        if (data && !controller.signal.aborted) {
          setResults(data.results ?? []);
          setTotalPages(data.total_pages ?? 1);
          setHasSearched(true);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    search();

    // Sync URL
    const params = new URLSearchParams();
    params.set('q', debouncedQuery);
    if (filter !== 'all') params.set('type', filter);
    router.replace(`${pathname}?${params}`, { scroll: false });

    return () => controller.abort();
  }, [debouncedQuery, filter, fetchResults, router, pathname]);

  // Load more pages
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !debouncedQuery) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const data = await fetchResults(debouncedQuery, filter, nextPage);
      if (data) {
        setResults((prev) => [...prev, ...(data.results ?? [])]);
        setTotalPages(data.total_pages ?? 1);
        setPage(nextPage);
      }
    } catch {
      // Silently fail — user can scroll again to retry
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, debouncedQuery, filter, isLoadingMore, fetchResults]);

  const sentinelRef = useInfiniteScroll(loadMore, {
    hasMore,
    isLoading: isLoading || isLoadingMore,
  });

  // Filter media results (exclude person from grid display)
  const mediaResults = results.filter(
    (
      r,
    ): r is
      | (MovieListResult & { media_type: 'movie' })
      | (TVListResult & { media_type: 'tv' }) =>
      r.media_type === 'movie' || r.media_type === 'tv',
  );

  const filters: { value: SearchFilter; label: string }[] = [
    { value: 'all', label: t('filterAll') },
    { value: 'movie', label: t('filterMovies') },
    { value: 'tv', label: t('filterTV') },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search input */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          className={cn(
            'bg-secondary/50 text-foreground placeholder:text-muted-foreground',
            'h-12 w-full rounded-lg border-none px-4 text-base',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            'transition-colors',
          )}
          autoFocus
          autoComplete="off"
        />
      </div>

      {/* Empty prompt when no query */}
      {!hasSearched && !isLoading ? (
        <p className="text-muted-foreground py-20 text-center text-lg">
          {t('emptyPrompt')}
        </p>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="border-border mb-6 flex gap-1 border-b">
            {filters.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  'cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                  filter === value
                    ? 'border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground border-transparent',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Results */}
          {isLoading ? (
            <SearchResultsSkeleton />
          ) : hasSearched && mediaResults.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center">
              {t('noResultsFor', { query: debouncedQuery })}
            </p>
          ) : mediaResults.length > 0 ? (
            <>
              <MediaGrid>
                {mediaResults.map((result) => (
                  <MediaCard
                    key={`${result.media_type}-${result.id}`}
                    id={result.id}
                    mediaType={result.media_type}
                    title={
                      result.media_type === 'movie' ? result.title : result.name
                    }
                    posterPath={result.poster_path}
                    releaseDate={
                      result.media_type === 'movie'
                        ? result.release_date
                        : result.first_air_date
                    }
                    voteAverage={result.vote_average}
                  />
                ))}
              </MediaGrid>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="flex justify-center py-8">
                {isLoadingMore && (
                  <Loader2 className="text-muted-foreground size-6 animate-spin" />
                )}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

function isValidFilter(value: string): value is SearchFilter {
  return value === 'all' || value === 'movie' || value === 'tv';
}
