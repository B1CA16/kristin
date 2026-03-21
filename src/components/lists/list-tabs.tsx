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
 * Shows item count badge on each tab.
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
      {/* Tab headers */}
      <div className="border-border mb-6 flex gap-1 border-b">
        {TABS.map(({ type, icon: Icon, labelKey }) => (
          <button
            key={type}
            onClick={() => setTab(type)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === type
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}
          >
            <Icon className="size-4" />
            {t(labelKey)}
            <span
              className={cn(
                'ml-1 rounded-full px-1.5 py-0.5 text-xs',
                tab === type
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {counts[type]}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content — key forces remount so useState picks up new initialItems */}
      <div key={tab}>{contentMap[tab]}</div>
    </div>
  );
}
