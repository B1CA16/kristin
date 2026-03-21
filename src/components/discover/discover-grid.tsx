'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
import { GenreCombobox } from '@/components/discover/genre-combobox';
import { FilterSelect } from '@/components/discover/filter-select';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import type { Genre, MovieListResult, TVListResult } from '@/lib/tmdb/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MediaType = 'movie' | 'tv';

type DiscoverResult = (MovieListResult | TVListResult) & {
  media_type?: MediaType;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => currentYear - i);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type DiscoverGridProps = {
  movieGenres: Genre[];
  tvGenres: Genre[];
  initialType?: MediaType;
  initialGenre?: string;
};

export function DiscoverGrid({
  movieGenres,
  tvGenres,
  initialType = 'movie',
  initialGenre = '',
}: DiscoverGridProps) {
  const t = useTranslations('discover');
  const locale = useLocale();

  const [mediaType, setMediaType] = useState<MediaType>(initialType);
  const [genreId, setGenreId] = useState(initialGenre);
  const [year, setYear] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [results, setResults] = useState<DiscoverResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isPending, startTransition] = useTransition();

  const genres = mediaType === 'movie' ? movieGenres : tvGenres;

  const sortOptions = [
    { value: 'popularity.desc', label: t('sortPopularity') },
    { value: 'vote_average.desc', label: t('sortRating') },
    { value: 'primary_release_date.desc', label: t('sortNewest') },
  ];

  const yearOptions = YEARS.map((y) => ({
    value: String(y),
    label: String(y),
  }));

  const fetchResults = useCallback(
    (fetchPage: number, append: boolean) => {
      startTransition(async () => {
        try {
          const params = new URLSearchParams({
            type: mediaType,
            page: String(fetchPage),
            locale,
            sortBy,
          });
          if (genreId) params.set('withGenres', genreId);
          if (year) params.set('year', year);

          const res = await fetch(`/api/tmdb/discover?${params}`);
          if (!res.ok) return;
          const data = await res.json();

          const newResults = data.results ?? [];
          setResults((prev) =>
            append ? [...prev, ...newResults] : newResults,
          );
          setHasMore(fetchPage < (data.total_pages ?? 1));
          setPage(fetchPage);
        } catch {
          // Fetch failed
        }
      });
    },
    [mediaType, locale, sortBy, genreId, year],
  );

  // Fetch when filters change
  useEffect(() => {
    fetchResults(1, false);
  }, [fetchResults]);

  const handleLoadMore = useCallback(() => {
    fetchResults(page + 1, true);
  }, [fetchResults, page]);

  const sentinelRef = useInfiniteScroll(handleLoadMore, {
    hasMore,
    isLoading: isPending,
  });

  const handleMediaTypeChange = (type: MediaType) => {
    if (type === mediaType) return;
    setMediaType(type);
    setGenreId(''); // Reset genre since genres differ between movie/tv
  };

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">{t('browse')}</h2>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {/* Media type toggle */}
        <div className="flex gap-1">
          {(['movie', 'tv'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleMediaTypeChange(type)}
              className={cn(
                'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                mediaType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              {type === 'movie' ? t('movies') : t('tvShows')}
            </button>
          ))}
        </div>

        <div className="bg-border hidden h-5 w-px sm:block" />

        {/* Genre combobox */}
        <GenreCombobox genres={genres} value={genreId} onChange={setGenreId} />

        {/* Year select */}
        <FilterSelect
          options={yearOptions}
          value={year}
          onChange={setYear}
          placeholder={t('anyYear')}
          width="w-[120px]"
        />

        {/* Sort select */}
        <FilterSelect
          options={sortOptions}
          value={sortBy}
          onChange={(v) => setSortBy(v || 'popularity.desc')}
          placeholder={t('sortBy')}
          width="w-[160px]"
        />
      </div>

      {/* Results grid */}
      {results.length > 0 ? (
        <MediaGrid>
          {results.map((item) => {
            const isMovie = 'title' in item;
            return (
              <MediaCard
                key={`${mediaType}-${item.id}`}
                id={item.id}
                mediaType={mediaType}
                title={
                  isMovie
                    ? (item as MovieListResult).title
                    : (item as TVListResult).name
                }
                posterPath={item.poster_path}
                releaseDate={
                  isMovie
                    ? (item as MovieListResult).release_date
                    : (item as TVListResult).first_air_date
                }
                voteAverage={item.vote_average}
              />
            );
          })}
        </MediaGrid>
      ) : (
        !isPending && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {t('noResults')}
          </p>
        )
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isPending && (
            <p className="text-muted-foreground text-sm">{t('loadingMore')}</p>
          )}
        </div>
      )}
    </section>
  );
}
