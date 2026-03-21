'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
import type { MovieListResult, TVListResult } from '@/lib/tmdb/types';

type TrendingResult = (MovieListResult | TVListResult) & {
  media_type?: 'movie' | 'tv';
};

/**
 * TMDB trending section with day/week toggle.
 * Fetches from our API proxy client-side to support the toggle.
 */
export function TMDBTrending() {
  const t = useTranslations('discover');
  const locale = useLocale();

  const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('day');
  const [results, setResults] = useState<TrendingResult[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchTrending = useCallback(
    (window: 'day' | 'week') => {
      startTransition(async () => {
        try {
          const params = new URLSearchParams({
            mediaType: 'all',
            timeWindow: window,
            page: '1',
            locale,
          });
          const res = await fetch(`/api/tmdb/trending?${params}`);
          if (!res.ok) return;
          const data = await res.json();
          setResults((data.results ?? []).slice(0, 12));
        } catch {
          // Fetch failed — keep existing results
        }
      });
    },
    [locale],
  );

  useEffect(() => {
    fetchTrending(timeWindow);
  }, [timeWindow, fetchTrending]);

  const handleToggle = (window: 'day' | 'week') => {
    if (window === timeWindow) return;
    setTimeWindow(window);
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('trendingOnTMDB')}</h2>
        <div className="flex gap-1">
          {(['day', 'week'] as const).map((w) => (
            <button
              key={w}
              onClick={() => handleToggle(w)}
              disabled={isPending}
              className={cn(
                'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                timeWindow === w
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              {t(w)}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 ? (
        <MediaGrid>
          {results.map((item) => {
            const isMovie = 'title' in item;
            return (
              <MediaCard
                key={`${item.media_type ?? (isMovie ? 'movie' : 'tv')}-${item.id}`}
                id={item.id}
                mediaType={item.media_type ?? (isMovie ? 'movie' : 'tv')}
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
            {t('trendingOnKristinEmpty')}
          </p>
        )
      )}
    </section>
  );
}
