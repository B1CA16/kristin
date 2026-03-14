import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { backdropUrl, posterUrl } from '@/lib/tmdb/image';
import { GenreBadge } from './genre-badge';
import { TrailerModal } from './trailer-modal';
import type { Genre, Video } from '@/lib/tmdb/types';

type MediaHeroProps = {
  title: string;
  tagline?: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  genres: Genre[];
  mediaType: 'movie' | 'tv';
  /** e.g. "2024" or "2020–2024" */
  yearDisplay: string;
  /** e.g. "2h 15m" or "3 seasons" */
  metaLine: string;
  voteAverage: number;
  videos?: Video[];
  /** Director for movies, creator for TV */
  creditLabel?: string;
  creditName?: string;
};

/**
 * Hero section for movie/TV detail pages.
 * Full-width backdrop with gradient, poster, and metadata overlay.
 */
export function MediaHero({
  title,
  tagline,
  overview,
  posterPath,
  backdropPath,
  genres,
  mediaType,
  yearDisplay,
  metaLine,
  voteAverage,
  videos = [],
  creditLabel,
  creditName,
}: MediaHeroProps) {
  const t = useTranslations('media');
  const backdrop = backdropUrl(backdropPath, 'lg');
  const poster = posterUrl(posterPath, 'xl');
  const rating = Math.round(voteAverage * 10) / 10;

  return (
    <section className="relative">
      {/* Backdrop */}
      <div className="relative h-[300px] w-full sm:h-[400px] md:h-[450px]">
        {backdrop ? (
          <Image
            src={backdrop}
            alt=""
            fill
            unoptimized
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="bg-muted h-full w-full" />
        )}
        {/* Gradient overlay — fades backdrop into the page background */}
        <div className="from-background/80 via-background/60 absolute inset-0 bg-gradient-to-t to-transparent" />
        <div className="from-background absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-32 flex flex-col gap-6 sm:-mt-40 sm:flex-row sm:gap-8">
          {/* Poster */}
          <div className="mx-auto w-[160px] shrink-0 sm:mx-0 sm:w-[200px] md:w-[240px]">
            <div className="bg-muted relative aspect-2/3 w-full overflow-hidden rounded-lg shadow-xl">
              {poster ? (
                <Image
                  src={poster}
                  alt={title}
                  fill
                  unoptimized
                  priority
                  sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, 240px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-muted-foreground text-sm">
                    {t('noImage')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col justify-end pb-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              {title}
            </h1>

            {tagline && (
              <p className="text-muted-foreground mt-1 text-sm italic">
                {tagline}
              </p>
            )}

            {/* Meta line: year · runtime/seasons · rating */}
            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {yearDisplay && <span>{yearDisplay}</span>}
              {metaLine && (
                <>
                  <span className="text-border">&middot;</span>
                  <span>{metaLine}</span>
                </>
              )}
              {rating > 0 && (
                <>
                  <span className="text-border">&middot;</span>
                  <span
                    className={cn(
                      'font-semibold',
                      rating >= 7
                        ? 'text-green-500'
                        : rating >= 5
                          ? 'text-amber-500'
                          : 'text-red-500',
                    )}
                  >
                    {rating}/10
                  </span>
                </>
              )}
            </div>

            {/* Director/Creator */}
            {creditLabel && creditName && (
              <p className="text-muted-foreground mt-1 text-sm">
                {creditLabel}:{' '}
                <span className="text-foreground font-medium">
                  {creditName}
                </span>
              </p>
            )}

            {/* Genres */}
            {genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {genres.map((genre) => (
                  <GenreBadge
                    key={genre.id}
                    id={genre.id}
                    name={genre.name}
                    mediaType={mediaType}
                  />
                ))}
              </div>
            )}

            {/* Overview */}
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed sm:line-clamp-4 sm:text-base">
              {overview || t('noOverview')}
            </p>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <TrailerModal videos={videos} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
