'use client';

import { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Genre } from '@/lib/tmdb/types';

type GenreComboboxProps = {
  genres: Genre[];
  value: string;
  onChange: (genreId: string) => void;
};

/**
 * Searchable genre dropdown. Displays "All Genres" when no selection,
 * or the selected genre name. Includes a search input to filter the list.
 */
export function GenreCombobox({ genres, value, onChange }: GenreComboboxProps) {
  const t = useTranslations('discover');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedGenre = genres.find((g) => String(g.id) === value);
  const filtered = search
    ? genres.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : genres;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 min-w-[140px] justify-between gap-2 font-normal"
        >
          <span className="truncate">
            {selectedGenre ? selectedGenre.name : t('allGenres')}
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        {/* Search input */}
        <div className="border-border flex items-center gap-2 border-b px-3 py-2">
          <Search className="text-muted-foreground size-3.5 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('allGenres')}
            className="text-foreground placeholder:text-muted-foreground h-7 w-full bg-transparent text-sm outline-none"
            autoFocus
          />
        </div>

        {/* Genre list */}
        <div className="max-h-[240px] overflow-y-auto p-1">
          {/* "All Genres" option */}
          <button
            onClick={() => {
              onChange('');
              setOpen(false);
              setSearch('');
            }}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
              'hover:bg-accent',
              value === '' && 'font-medium',
            )}
          >
            <Check
              className={cn(
                'size-3.5',
                value === '' ? 'opacity-100' : 'opacity-0',
              )}
            />
            {t('allGenres')}
          </button>

          {filtered.map((genre) => {
            const isSelected = String(genre.id) === value;
            return (
              <button
                key={genre.id}
                onClick={() => {
                  onChange(isSelected ? '' : String(genre.id));
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                  'hover:bg-accent',
                  isSelected && 'font-medium',
                )}
              >
                <Check
                  className={cn(
                    'size-3.5',
                    isSelected ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {genre.name}
              </button>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-xs">
              {t('noResults')}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
