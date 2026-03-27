'use client';

import { useState } from 'react';
import { Bookmark, Eye, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

type ListType = 'watchlist' | 'watched' | 'favorite';

type ListTabsProps = {
  watchlistContent: React.ReactNode;
  watchedContent: React.ReactNode;
  favoriteContent: React.ReactNode;
  counts: { watchlist: number; watched: number; favorite: number };
};

const TABS: { type: ListType; icon: typeof Bookmark; labelKey: string }[] = [
  { type: 'watchlist', icon: Bookmark, labelKey: 'watchlist' },
  { type: 'watched', icon: Eye, labelKey: 'watched' },
  { type: 'favorite', icon: Heart, labelKey: 'favorite' },
];

/**
 * Tabs for switching between watchlist, watched, and favorites.
 * Pill-shaped with count badges.
 */
export function ListTabs({
  watchlistContent,
  watchedContent,
  favoriteContent,
  counts,
}: ListTabsProps) {
  const t = useTranslations('lists');
  const [tab, setTab] = useState<ListType>('watchlist');

  const contentMap: Record<ListType, React.ReactNode> = {
    watchlist: watchlistContent,
    watched: watchedContent,
    favorite: favoriteContent,
  };

  return (
    <div>
      {/* Tab headers — pill style */}
      <div className="mb-6 flex gap-1.5">
        {TABS.map(({ type, icon: Icon, labelKey }) => (
          <button
            key={type}
            onClick={() => setTab(type)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200',
              tab === type
                ? 'bg-primary text-primary-foreground shadow-primary/25 shadow-md'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
            )}
          >
            <Icon className="size-4" />
            {t(labelKey)}
            <span
              className={cn(
                'ml-0.5 rounded-full px-1.5 py-0.5 text-xs',
                tab === type
                  ? 'text-primary-foreground bg-white/20'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {counts[type]}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div key={tab}>{contentMap[tab]}</div>
    </div>
  );
}
