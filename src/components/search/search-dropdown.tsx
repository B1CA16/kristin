'use client';

import Image from 'next/image';
import { Film, Tv, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { posterUrl, profileUrl } from '@/lib/tmdb/image';
import { Link } from '@/i18n/navigation';
import type { MultiSearchResult } from '@/lib/tmdb/types';

type SearchDropdownProps = {
  results: MultiSearchResult[];
  isLoading: boolean;
  query: string;
  onClose: () => void;
};

/**
 * Autocomplete dropdown shown below the search bar.
 * Displays up to 8 results with poster thumbnails.
 */
export function SearchDropdown({
  results,
  isLoading,
  query,
  onClose,
}: SearchDropdownProps) {
  const t = useTranslations('search');

  if (isLoading) {
    return (
      <div className="bg-popover border-border absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-md border shadow-lg">
        <div className="flex flex-col gap-1 p-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="bg-muted h-12 w-8 animate-pulse rounded" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="bg-muted h-3.5 w-3/4 animate-pulse rounded" />
                <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-popover border-border absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-md border shadow-lg">
        <p className="text-muted-foreground p-4 text-center text-sm">
          {t('noResults')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-popover border-border absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-md border shadow-lg">
      <ul className="flex flex-col p-1" role="listbox">
        {results.map((result) => (
          <SearchDropdownItem
            key={`${result.media_type}-${result.id}`}
            result={result}
            onClose={onClose}
          />
        ))}
      </ul>

      {/* "View all results" link */}
      <div className="border-border border-t p-2">
        <Link
          href={`/search?q=${encodeURIComponent(query)}`}
          onClick={onClose}
          className="text-primary block text-center text-sm font-medium hover:underline"
        >
          {t('resultsFor', { query })}
        </Link>
      </div>
    </div>
  );
}

function SearchDropdownItem({
  result,
  onClose,
}: {
  result: MultiSearchResult;
  onClose: () => void;
}) {
  const title = getTitle(result);
  const year = getYear(result);
  const thumbnail = getThumbnail(result);
  const href = getHref(result);

  return (
    <li role="option" aria-selected={false}>
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 rounded-sm p-2',
          'hover:bg-accent transition-colors',
        )}
      >
        {/* Thumbnail */}
        <div className="bg-muted relative h-12 w-8 shrink-0 overflow-hidden rounded">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              unoptimized
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <MediaTypeIcon
                mediaType={result.media_type}
                className="text-muted-foreground size-4"
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{title}</span>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <MediaTypeIcon mediaType={result.media_type} className="size-3" />
            {getTypeLabel(result)}
            {year && <span> &middot; {year}</span>}
          </span>
        </div>
      </Link>
    </li>
  );
}

// --- Helpers ---

function getTitle(result: MultiSearchResult): string {
  if (result.media_type === 'movie') return result.title;
  if (result.media_type === 'tv') return result.name;
  return result.name;
}

function getYear(result: MultiSearchResult): string | null {
  if (result.media_type === 'movie' && result.release_date) {
    return result.release_date.slice(0, 4);
  }
  if (result.media_type === 'tv' && result.first_air_date) {
    return result.first_air_date.slice(0, 4);
  }
  return null;
}

function getThumbnail(result: MultiSearchResult): string | null {
  if (result.media_type === 'person')
    return profileUrl(result.profile_path, 'sm');
  return posterUrl(
    result.media_type === 'movie' ? result.poster_path : result.poster_path,
    'xs',
  );
}

function getHref(result: MultiSearchResult): string {
  if (result.media_type === 'person')
    return `/search?q=${encodeURIComponent(result.name)}`;
  return `/${result.media_type}/${result.id}`;
}

/** Renders the appropriate icon for a media type. Declared at module level to avoid React's static-components rule. */
function MediaTypeIcon({
  mediaType,
  className,
}: {
  mediaType: string;
  className?: string;
}) {
  if (mediaType === 'movie') return <Film className={className} />;
  if (mediaType === 'tv') return <Tv className={className} />;
  return <User className={className} />;
}

function getTypeLabel(result: MultiSearchResult): string {
  if (result.media_type === 'movie') return 'Movie';
  if (result.media_type === 'tv') return 'TV';
  return 'Person';
}
