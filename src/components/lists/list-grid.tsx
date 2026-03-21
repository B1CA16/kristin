'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
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
 * Paginated grid of media cards with a "Load More" button.
 * Initial items are server-rendered; additional pages are fetched client-side.
 */
export function ListGrid({
  listType,
  initialItems,
  initialHasMore,
  emptyState,
}: ListGridProps) {
  const t = useTranslations('lists');
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
      <MediaGrid>
        {items.map((item) => (
          <MediaCard
            key={`${item.mediaType}-${item.id}`}
            id={item.id}
            mediaType={item.mediaType}
            title={item.title}
            posterPath={item.posterPath}
          />
        ))}
      </MediaGrid>

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
