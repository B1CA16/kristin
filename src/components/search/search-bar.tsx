'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Film, Search, Tv, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { posterUrl } from '@/lib/tmdb/image';
import { useDebounce } from '@/hooks/use-debounce';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import type { MultiSearchResult } from '@/lib/tmdb/types';
import { SearchDropdown } from './search-dropdown';

type SearchBarProps = {
  className?: string;
};

/**
 * Search input with debounced autocomplete dropdown.
 * Shows recently viewed media items when focused with empty input.
 */
export function SearchBar({ className }: SearchBarProps) {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const isSearchPage = pathname.startsWith('/search');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MultiSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const { recent, addItem, clearRecent } = useRecentSearches();

  const debouncedQuery = useDebounce(query.trim(), 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch autocomplete results
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setShowRecent(false);

    const controller = new AbortController();

    async function fetchResults() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          query: debouncedQuery,
          page: '1',
          locale,
        });
        const res = await fetch(`/api/tmdb/search?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data.results?.slice(0, 8) ?? []);
        setIsOpen(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResults();

    return () => controller.abort();
  }, [debouncedQuery, locale]);

  // Close dropdowns when navigating
  useEffect(() => {
    setIsOpen(false);
    setShowRecent(false);
    setQuery('');
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowRecent(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Save the clicked result to recent items. */
  const handleResultClick = useCallback(
    (result: MultiSearchResult) => {
      if (result.media_type === 'movie' || result.media_type === 'tv') {
        addItem({
          id: result.id,
          mediaType: result.media_type,
          title: result.media_type === 'movie' ? result.title : result.name,
          posterPath: result.poster_path,
        });
      }
    },
    [addItem],
  );

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      setIsOpen(false);
      setShowRecent(false);
      inputRef.current?.blur();
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [query, router],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setShowRecent(false);
    inputRef.current?.focus();
  }, []);

  if (isSearchPage) return null;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} role="search">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) {
                setIsOpen(true);
              } else if (!query.trim() && recent.length > 0) {
                setShowRecent(true);
              }
            }}
            placeholder={t('placeholder')}
            aria-label={t('placeholder')}
            className={cn(
              'bg-secondary/50 text-foreground placeholder:text-muted-foreground',
              'h-9 w-full rounded-md border-none pr-8 pl-9 text-sm',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              'transition-colors',
            )}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </form>

      {isOpen && (
        <SearchDropdown
          results={results}
          isLoading={isLoading}
          query={query}
          onClose={() => setIsOpen(false)}
          onResultClick={handleResultClick}
        />
      )}

      {/* Recent items dropdown */}
      {showRecent && !isOpen && recent.length > 0 && (
        <div className="bg-popover border-border absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-md border shadow-lg">
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <span className="text-muted-foreground text-xs font-medium">
              {t('recentSearches')}
            </span>
            <button
              onClick={() => {
                clearRecent();
                setShowRecent(false);
              }}
              className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
            >
              {t('clearRecent')}
            </button>
          </div>
          <ul className="flex flex-col p-1">
            {recent.map((item) => (
              <li key={`${item.mediaType}-${item.id}`}>
                <Link
                  href={`/${item.mediaType}/${item.id}`}
                  onClick={() => setShowRecent(false)}
                  className="hover:bg-accent flex items-center gap-3 rounded-sm p-2 transition-colors"
                >
                  <div className="bg-muted relative h-10 w-7 shrink-0 overflow-hidden rounded">
                    {posterUrl(item.posterPath, 'xs') ? (
                      <Image
                        src={posterUrl(item.posterPath, 'xs')!}
                        alt={item.title}
                        fill
                        unoptimized
                        sizes="28px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {item.mediaType === 'movie' ? (
                          <Film className="text-muted-foreground size-3" />
                        ) : (
                          <Tv className="text-muted-foreground size-3" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.mediaType === 'movie' ? 'Movie' : 'TV'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
