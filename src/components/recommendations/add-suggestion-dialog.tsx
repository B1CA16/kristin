'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import { Plus, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { inputClass, textareaClass } from '@/lib/styles';
import { posterUrl } from '@/lib/tmdb/image';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createSuggestion } from '@/actions/suggestions';
import type { MovieListResult, TVListResult } from '@/lib/tmdb/types';

type AddSuggestionDialogProps = {
  sourceTmdbId: number;
  sourceMediaType: 'movie' | 'tv';
  isLoggedIn: boolean;
};

type SearchResult = (MovieListResult | TVListResult) & {
  media_type: 'movie' | 'tv';
};

export function AddSuggestionDialog({
  sourceTmdbId,
  sourceMediaType,
  isLoggedIn,
}: AddSuggestionDialogProps) {
  const t = useTranslations('suggestions');
  const tSearch = useTranslations('search');
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const debouncedQuery = useDebounce(query.trim(), 300);

  // Search for media to suggest
  useEffect(() => {
    const controller = new AbortController();

    async function search() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      try {
        const params = new URLSearchParams({
          query: debouncedQuery,
          page: '1',
          locale,
        });
        const res = await fetch(`/api/tmdb/search?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();

        // Filter to movies and TV, exclude the source itself, tag media_type
        const filtered = (data.results ?? [])
          .filter(
            (r: SearchResult) =>
              (r.media_type === 'movie' || r.media_type === 'tv') &&
              !(r.id === sourceTmdbId && r.media_type === sourceMediaType),
          )
          .slice(0, 8) as SearchResult[];

        setResults(filtered);
      } catch {
        // Ignore abort errors
      }
    }

    search();
    return () => controller.abort();
  }, [debouncedQuery, locale, sourceTmdbId, sourceMediaType]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;

    setError('');
    startTransition(async () => {
      const result = await createSuggestion(
        { tmdbId: sourceTmdbId, mediaType: sourceMediaType },
        { tmdbId: selected.id, mediaType: selected.media_type },
        reason,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      // Success — close dialog and reset
      setOpen(false);
      setQuery('');
      setResults([]);
      setSelected(null);
      setReason('');
    });
  }, [selected, sourceTmdbId, sourceMediaType, reason]);

  // Reset state when dialog closes
  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelected(null);
      setReason('');
      setError('');
    }
  }

  if (!isLoggedIn) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5">
        <Plus className="size-4" />
        {t('loginToSuggest')}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Plus className="size-4" />
        {t('addSuggestion')}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('suggestTitle')}</DialogTitle>
            <DialogDescription>{t('suggestDescription')}</DialogDescription>
          </DialogHeader>

          {/* Search input */}
          {!selected && (
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tSearch('placeholder')}
                className={cn(inputClass, 'pr-3 pl-9')}
                autoFocus
                autoComplete="off"
              />
            </div>
          )}

          {/* Search results */}
          {!selected && results.length > 0 && (
            <ul className="max-h-[240px] space-y-1 overflow-y-auto">
              {results.map((result) => {
                const title =
                  result.media_type === 'movie'
                    ? (result as MovieListResult).title
                    : (result as TVListResult).name;
                const poster = posterUrl(result.poster_path, 'xs');
                const year =
                  result.media_type === 'movie'
                    ? (result as MovieListResult).release_date?.slice(0, 4)
                    : (result as TVListResult).first_air_date?.slice(0, 4);

                return (
                  <li key={`${result.media_type}-${result.id}`}>
                    <button
                      onClick={() => setSelected(result)}
                      className="hover:bg-accent flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left transition-colors"
                    >
                      <div className="bg-muted relative h-12 w-8 shrink-0 overflow-hidden rounded">
                        {poster && (
                          <Image
                            src={poster}
                            alt={title}
                            fill
                            unoptimized
                            sizes="32px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{title}</p>
                        <p className="text-muted-foreground text-xs">
                          {result.media_type === 'movie' ? 'Movie' : 'TV'}
                          {year && ` · ${year}`}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Selected media + reason */}
          {selected && (
            <div className="space-y-4">
              <div className="bg-secondary/50 flex items-center gap-3 rounded-md p-3">
                <div className="bg-muted relative h-16 w-11 shrink-0 overflow-hidden rounded">
                  {posterUrl(selected.poster_path, 'xs') && (
                    <Image
                      src={posterUrl(selected.poster_path, 'xs')!}
                      alt={
                        selected.media_type === 'movie'
                          ? (selected as MovieListResult).title
                          : (selected as TVListResult).name
                      }
                      fill
                      unoptimized
                      sizes="44px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {selected.media_type === 'movie'
                      ? (selected as MovieListResult).title
                      : (selected as TVListResult).name}
                  </p>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-primary mt-0.5 cursor-pointer text-xs hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="text-muted-foreground mb-1.5 block text-sm"
                >
                  {t('reason')}
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('reasonPlaceholder')}
                  rows={2}
                  maxLength={280}
                  className={textareaClass}
                />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? t('submitting') : t('submit')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
