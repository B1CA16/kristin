'use client';

import { useCallback, useOptimistic, useTransition } from 'react';
import { Bookmark, Eye, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { toggleListItem, type ListStatus } from '@/actions/lists';

type MediaActionsProps = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  initialStatus: ListStatus;
  isLoggedIn: boolean;
};

type ListType = 'watchlist' | 'watched' | 'favorite';

const LIST_CONFIG: {
  type: ListType;
  icon: typeof Bookmark;
  labelKey: string;
  activeClass: string;
}[] = [
  {
    type: 'watchlist',
    icon: Bookmark,
    labelKey: 'watchlist',
    activeClass: 'text-blue-500',
  },
  {
    type: 'watched',
    icon: Eye,
    labelKey: 'watched',
    activeClass: 'text-green-500',
  },
  {
    type: 'favorite',
    icon: Heart,
    labelKey: 'favorite',
    activeClass: 'text-red-500',
  },
];

/**
 * Watchlist, watched, and favorite toggle buttons with optimistic UI.
 * Rendered in the hero section of media detail pages.
 */
export function MediaActions({
  tmdbId,
  mediaType,
  initialStatus,
  isLoggedIn,
}: MediaActionsProps) {
  const t = useTranslations('lists');
  const [isPending, startTransition] = useTransition();

  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    initialStatus,
    (current: ListStatus, toggledType: ListType) => ({
      ...current,
      [toggledType]: !current[toggledType],
    }),
  );

  const handleToggle = useCallback(
    (listType: ListType) => {
      if (!isLoggedIn) return;

      startTransition(async () => {
        setOptimisticStatus(listType);

        const { error } = await toggleListItem({ tmdbId, mediaType }, listType);

        if (error) {
          console.error('List toggle error:', error);
        }
      });
    },
    [isLoggedIn, tmdbId, mediaType, setOptimisticStatus],
  );

  return (
    <>
      {LIST_CONFIG.map(({ type, icon: Icon, labelKey, activeClass }) => {
        const isActive = optimisticStatus[type];

        return (
          <button
            key={type}
            onClick={() => handleToggle(type)}
            disabled={isPending || !isLoggedIn}
            title={isLoggedIn ? t(labelKey) : t('loginRequired')}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? `bg-white/10 ${activeClass}`
                : 'text-muted-foreground hover:bg-white/10 hover:text-white',
              (!isLoggedIn || isPending) && 'cursor-not-allowed opacity-50',
            )}
          >
            <Icon className={cn('size-4', isActive && 'fill-current')} />
            <span className="hidden sm:inline">{t(labelKey)}</span>
          </button>
        );
      })}
    </>
  );
}
