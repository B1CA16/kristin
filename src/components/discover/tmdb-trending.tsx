'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { MediaCard } from '@/components/media/media-card';
import { MediaRow } from '@/components/media/media-row';
import type { MovieListResult, TVListResult } from '@/lib/tmdb/types';

type TrendingResult = (MovieListResult | TVListResult) & {
  media_type?: 'movie' | 'tv';
};

/**
 * TMDB trending horizontal row with day/week toggle.
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
          setResults((data.results ?? []).slice(0, 20));
        } catch {
          // Fetch failed
        }
      });
    },
    [locale],
  );

  useEffect(() => {
    fetchTrending(timeWindow);
  }, [timeWindow, fetchTrending]);

  const toggle = (
    <div className="flex gap-1">
      {(['day', 'week'] as const).map((w) => (
        <button
          key={w}
          onClick={() => setTimeWindow(w)}
          disabled={isPending}
          className={cn(
            'cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            timeWindow === w
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent',
          )}
        >
          {t(w)}
        </button>
      ))}
    </div>
  );

  if (results.length === 0 && !isPending) return null;

  return (
    <MediaRow title={t('trendingOnTMDB')} trailing={toggle}>
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
    </MediaRow>
  );
}
