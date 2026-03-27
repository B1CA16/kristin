import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { Bookmark, Eye, Heart } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { getMediaBasicInfo } from '@/lib/tmdb';
import { getUserList, type UserListItem } from '@/actions/lists';
import { ListTabs } from '@/components/lists/list-tabs';
import { ListGrid } from '@/components/lists/list-grid';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('lists');
  return { title: t('pageTitle') };
}

/** Resolve TMDB info for a list of saved items. */
async function resolveListItems(
  items: UserListItem[],
  locale: string,
): Promise<
  {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath: string | null;
  }[]
> {
  const results = await Promise.all(
    items.map(async (item) => {
      try {
        const info = await getMediaBasicInfo(item.tmdbId, item.mediaType, {
          locale,
        });
        return {
          id: item.tmdbId,
          mediaType: item.mediaType,
          title: info.title,
          posterPath: info.posterPath,
        };
      } catch {
        return {
          id: item.tmdbId,
          mediaType: item.mediaType,
          title: 'Unknown',
          posterPath: null,
        };
      }
    }),
  );
  return results;
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: typeof Bookmark;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="bg-muted mb-4 rounded-full p-4">
        <Icon className="text-muted-foreground size-8" />
      </div>
      <p className="text-muted-foreground text-center text-sm">{message}</p>
    </div>
  );
}

export default async function ListsPage() {
  const locale = await getLocale();
  const t = await getTranslations('lists');

  // Auth check — redirect to login if not logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Fetch first page of all three lists in parallel
  const [watchlistResult, watchedResult, favoriteResult] = await Promise.all([
    getUserList('watchlist'),
    getUserList('watched'),
    getUserList('favorite'),
  ]);

  // Resolve TMDB info for all items in parallel
  const [watchlistItems, watchedItems, favoriteItems] = await Promise.all([
    resolveListItems(watchlistResult.data, locale),
    resolveListItems(watchedResult.data, locale),
    resolveListItems(favoriteResult.data, locale),
  ]);

  return (
    <div className="relative mx-auto max-w-7xl overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="blob bg-primary/[0.07] absolute -top-20 -right-32 size-80" />
      <div className="blob bg-primary/[0.05] absolute bottom-1/4 -left-24 size-72" />
      <h1 className="font-display mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
        {t('pageTitle')}
      </h1>

      <ListTabs
        watchlistContent={
          <ListGrid
            listType="watchlist"
            initialItems={watchlistItems}
            initialHasMore={watchlistResult.hasMore}
            emptyState={
              <EmptyState icon={Bookmark} message={t('emptyWatchlist')} />
            }
          />
        }
        watchedContent={
          <ListGrid
            listType="watched"
            initialItems={watchedItems}
            initialHasMore={watchedResult.hasMore}
            emptyState={<EmptyState icon={Eye} message={t('emptyWatched')} />}
          />
        }
        favoriteContent={
          <ListGrid
            listType="favorite"
            initialItems={favoriteItems}
            initialHasMore={favoriteResult.hasMore}
            emptyState={
              <EmptyState icon={Heart} message={t('emptyFavorite')} />
            }
          />
        }
        counts={{
          watchlist: watchlistResult.total,
          watched: watchedResult.total,
          favorite: favoriteResult.total,
        }}
      />
    </div>
  );
}
