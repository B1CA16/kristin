'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { backdropUrl, posterUrl } from '@/lib/tmdb/image';
import { slideUp, staggerContainer, DURATION, EASE } from '@/lib/motion';
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
  yearDisplay: string;
  metaLine: string;
  voteAverage: number;
  videos?: Video[];
  creditLabel?: string;
  creditName?: string;
  actions?: React.ReactNode;
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
  actions,
}: MediaHeroProps) {
  const t = useTranslations('media');
  const reduced = useReducedMotion();
  const backdrop = backdropUrl(backdropPath, 'lg');
  const poster = posterUrl(posterPath, 'xl');
  const rating = Math.round(voteAverage * 10) / 10;

  const MotionDiv = reduced ? 'div' : motion.div;

  return (
    <section className="relative">
      {/* Backdrop */}
      <MotionDiv
        className="relative h-[300px] w-full sm:h-[400px] md:h-[450px]"
        {...(!reduced && {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: DURATION.entrance, ease: EASE.smooth },
        })}
      >
        {backdrop ? (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="bg-muted h-full w-full" />
        )}
        <div className="from-background/80 via-background/60 absolute inset-0 bg-gradient-to-t to-transparent" />
        <div className="from-background absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent" />
      </MotionDiv>

      {/* Content overlay */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-32 flex flex-col gap-6 sm:-mt-40 sm:flex-row sm:gap-8">
          {/* Poster */}
          <MotionDiv
            className="mx-auto w-[160px] shrink-0 sm:mx-0 sm:w-[200px] md:w-[240px]"
            {...(!reduced && {
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              transition: {
                duration: DURATION.entrance,
                ease: EASE.spring,
                delay: 0.15,
              },
            })}
          >
            <div className="bg-muted relative aspect-2/3 w-full overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
              {poster ? (
                <Image
                  src={poster}
                  alt={title}
                  fill
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
          </MotionDiv>

          {/* Info */}
          <MotionDiv
            className="flex min-w-0 flex-1 flex-col justify-end pb-2"
            {...(!reduced && {
              variants: staggerContainer,
              initial: 'hidden',
              animate: 'visible',
            })}
          >
            <MotionDiv {...(!reduced && { variants: slideUp })}>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {title}
              </h1>
            </MotionDiv>

            {tagline && (
              <MotionDiv {...(!reduced && { variants: slideUp })}>
                <p className="text-muted-foreground mt-1 text-sm italic">
                  {tagline}
                </p>
              </MotionDiv>
            )}

            <MotionDiv {...(!reduced && { variants: slideUp })}>
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
            </MotionDiv>

            {creditLabel && creditName && (
              <MotionDiv {...(!reduced && { variants: slideUp })}>
                <p className="text-muted-foreground mt-1 text-sm">
                  {creditLabel}:{' '}
                  <span className="text-foreground font-medium">
                    {creditName}
                  </span>
                </p>
              </MotionDiv>
            )}

            {genres.length > 0 && (
              <MotionDiv {...(!reduced && { variants: slideUp })}>
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
              </MotionDiv>
            )}

            <MotionDiv {...(!reduced && { variants: slideUp })}>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed sm:line-clamp-4 sm:text-base">
                {overview || t('noOverview')}
              </p>
            </MotionDiv>

            <MotionDiv {...(!reduced && { variants: slideUp })}>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <TrailerModal videos={videos} />
                {actions}
              </div>
            </MotionDiv>
          </MotionDiv>
        </div>
      </div>
    </section>
  );
}
