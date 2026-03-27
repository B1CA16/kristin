import Image from 'next/image';
import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';
import { posterUrl } from '@/lib/tmdb/image';
import { Link } from '@/i18n/navigation';

type MediaCardProps = {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  releaseDate?: string;
  voteAverage?: number;
  className?: string;
};

/**
 * Poster-dominant card with rounded-2xl shape, clean hover lift,
 * and warm rating badge.
 */
export function MediaCard({
  id,
  mediaType,
  title,
  posterPath,
  releaseDate,
  voteAverage,
  className,
}: MediaCardProps) {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const rating = voteAverage ? Math.round(voteAverage * 10) / 10 : null;
  const poster = posterUrl(posterPath, 'lg');
  const href = `/${mediaType}/${id}`;

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'bg-card',
        'transition-all duration-300',
        'hover:shadow-lg',
        'active:scale-[0.98]',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      {/* Poster */}
      <div className="bg-muted relative aspect-2/3 w-full overflow-hidden">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            unoptimized
            sizes="(max-width: 475px) 45vw, (max-width: 640px) 30vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 185px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-foreground text-xs">No image</span>
          </div>
        )}

        {/* Rating badge */}
        {rating !== null && rating > 0 && (
          <div
            className={cn(
              'absolute top-2 right-2 flex items-center gap-0.5',
              'rounded-full px-2 py-0.5 text-xs font-semibold',
              'bg-black/70 text-white backdrop-blur-sm',
            )}
          >
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium">
          {title}
        </h3>
        {year && <span className="text-muted-foreground text-xs">{year}</span>}
      </div>
    </Link>
  );
}
