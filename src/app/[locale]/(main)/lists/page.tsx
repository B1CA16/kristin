import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { Bookmark, Eye, Heart } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { getMediaBasicInfo } from '@/lib/tmdb';
import { getUserList, type UserListItem } from '@/actions/lists';
import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
import { ListTabs } from '@/components/lists/list-tabs';

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

  // Fetch all three lists in parallel
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

  const emptyIcons: Record<string, typeof Bookmark> = {
    emptyWatchlist: Bookmark,
    emptyWatched: Eye,
    emptyFavorite: Heart,
  };

  function renderGrid(
    items: {
      id: number;
      mediaType: 'movie' | 'tv';
      title: string;
      posterPath: string | null;
    }[],
    emptyKey: string,
  ) {
    if (items.length === 0) {
      const Icon = emptyIcons[emptyKey] ?? Bookmark;
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-muted mb-4 rounded-full p-4">
            <Icon className="text-muted-foreground size-8" />
          </div>
          <p className="text-muted-foreground text-center text-sm">
            {t(emptyKey)}
          </p>
        </div>
      );
    }

    return (
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
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
        {t('pageTitle')}
      </h1>

      <ListTabs
        watchlistContent={renderGrid(watchlistItems, 'emptyWatchlist')}
        watchedContent={renderGrid(watchedItems, 'emptyWatched')}
        favoriteContent={renderGrid(favoriteItems, 'emptyFavorite')}
        counts={{
          watchlist: watchlistItems.length,
          watched: watchedItems.length,
          favorite: favoriteItems.length,
        }}
      />
    </div>
  );
}
