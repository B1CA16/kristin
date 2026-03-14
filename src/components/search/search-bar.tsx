'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { usePathname } from '@/i18n/navigation';
import type { MultiSearchResult } from '@/lib/tmdb/types';
import { SearchDropdown } from './search-dropdown';

type SearchBarProps = {
  className?: string;
};

/**
 * Search input with debounced autocomplete dropdown.
 * Fetches results from /api/tmdb/search after 300ms of inactivity.
 * Enter key or clicking a result navigates to the detail page.
 */
export function SearchBar({ className }: SearchBarProps) {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // Hide when already on the search page (it has its own input)
  const isSearchPage = pathname.startsWith('/search');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MultiSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  // Close dropdown when navigating
  useEffect(() => {
    setIsOpen(false);
    setQuery('');
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      setIsOpen(false);
      inputRef.current?.blur();
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [query, router],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
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
              if (results.length > 0) setIsOpen(true);
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
        />
      )}
    </div>
  );
}
