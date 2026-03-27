'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MediaCard } from '@/components/media/media-card';
import { loadMoreListItems } from '@/actions/lists';

type ListItem = {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
};

type ListGridProps = {
  listType: 'watchlist' | 'watched' | 'favorite';
  initialItems: ListItem[];
  initialHasMore: boolean;
  emptyState: React.ReactNode;
};

/**
 * Paginated grid of media cards with layout animations
 * and a "Load More" button.
 */
export function ListGrid({
  listType,
  initialItems,
  initialHasMore,
  emptyState,
}: ListGridProps) {
  const t = useTranslations('lists');
  const reduced = useReducedMotion();
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  function handleLoadMore() {
    startTransition(async () => {
      const result = await loadMoreListItems(listType, items.length);

      if (result.error) {
        console.error('Load more error:', result.error);
        return;
      }

      setItems((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
    });
  }

  return (
    <div>
      <div
        className={cn(
          'grid grid-cols-2 gap-3',
          'min-[475px]:grid-cols-3',
          'sm:grid-cols-4 sm:gap-4',
          'md:grid-cols-5',
          'lg:grid-cols-6',
        )}
      >
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.div
              key={`${item.mediaType}-${item.id}`}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: reduced ? 0 : i * 0.03 }}
            >
              <MediaCard
                id={item.id}
                mediaType={item.mediaType}
                title={item.title}
                posterPath={item.posterPath}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('loading')}
              </>
            ) : (
              t('loadMore')
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
