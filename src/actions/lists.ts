'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient, getUser } from '@/lib/supabase/server';
import { logActivity } from '@/actions/activity';
import { getMediaBasicInfo } from '@/lib/tmdb';

import type { MediaRef } from '@/types/media';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ListType = 'watchlist' | 'watched' | 'favorite';

/** Status of a media item across all three list types for the current user. */
export type ListStatus = {
  watchlist: boolean;
  watched: boolean;
  favorite: boolean;
};

// ---------------------------------------------------------------------------
// getListStatus
// ---------------------------------------------------------------------------

/**
 * Check which lists a media item belongs to for the current user.
 * Returns { watchlist, watched, favorite } booleans.
 */
export async function getListStatus(
  media: MediaRef,
): Promise<{ data: ListStatus; error: string | null }> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return {
      data: { watchlist: false, watched: false, favorite: false },
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('user_lists')
    .select('list_type')
    .eq('user_id', user.id)
    .eq('tmdb_id', media.tmdbId)
    .eq('media_type', media.mediaType);

  if (error) {
    return {
      data: { watchlist: false, watched: false, favorite: false },
      error: error.message,
    };
  }

  const types = new Set(data.map((row) => row.list_type));

  return {
    data: {
      watchlist: types.has('watchlist'),
      watched: types.has('watched'),
      favorite: types.has('favorite'),
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// toggleListItem
// ---------------------------------------------------------------------------

/**
 * Add or remove a media item from a user's list.
 * If already in the list, removes it. If not, adds it.
 * Returns the new state (true = in list, false = removed).
 */
export async function toggleListItem(
  media: MediaRef,
  listType: ListType,
): Promise<{ added: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { added: false, error: 'You must be logged in.' };
  }

  // Check if already in list
  const { data: existing } = await supabase
    .from('user_lists')
    .select('id')
    .eq('user_id', user.id)
    .eq('tmdb_id', media.tmdbId)
    .eq('media_type', media.mediaType)
    .eq('list_type', listType)
    .single();

  if (existing) {
    // Remove
    const { error } = await supabase
      .from('user_lists')
      .delete()
      .eq('id', existing.id);

    if (error) {
      return { added: false, error: error.message };
    }

    revalidatePath(`/${media.mediaType}/${media.tmdbId}`);
    return { added: false, error: null };
  }

  // Add
  const { error } = await supabase.from('user_lists').insert({
    user_id: user.id,
    tmdb_id: media.tmdbId,
    media_type: media.mediaType,
    list_type: listType,
  });

  if (error) {
    return { added: false, error: error.message };
  }

  void logActivity({
    userId: user.id,
    tmdbId: media.tmdbId,
    mediaType: media.mediaType,
    action: `${listType}_added`,
  });

  revalidatePath(`/${media.mediaType}/${media.tmdbId}`);
  return { added: true, error: null };
}

// ---------------------------------------------------------------------------
// getUserList
// ---------------------------------------------------------------------------

export type UserListItem = {
  id: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  createdAt: string;
};

/** Number of items per page. */
const LIST_PAGE_SIZE = 20;

/**
 * Get a paginated slice of a user's list, sorted by most recently added.
 * Returns `hasMore` to indicate if additional pages exist.
 */
export async function getUserList(
  listType: ListType,
  options: { offset?: number; limit?: number } = {},
): Promise<{
  data: UserListItem[];
  total: number;
  hasMore: boolean;
  error: string | null;
}> {
  const supabase = await createClient();
  const offset = options.offset ?? 0;
  const limit = options.limit ?? LIST_PAGE_SIZE;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: [],
      total: 0,
      hasMore: false,
      error: 'You must be logged in.',
    };
  }

  const { data, error, count } = await supabase
    .from('user_lists')
    .select('id, tmdb_id, media_type, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('list_type', listType)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { data: [], total: 0, hasMore: false, error: error.message };
  }

  const total = count ?? 0;
  const mapped: UserListItem[] = data.map((row) => ({
    id: row.id,
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    createdAt: row.created_at,
  }));

  return {
    data: mapped,
    total,
    hasMore: offset + limit < total,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// loadMoreListItems
// ---------------------------------------------------------------------------

type ResolvedListItem = {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
};

/**
 * Server action for client-side "Load More" pagination.
 * Fetches the next page of list items and resolves their TMDB info.
 */
export async function loadMoreListItems(
  listType: ListType,
  offset: number,
): Promise<{
  data: ResolvedListItem[];
  hasMore: boolean;
  error: string | null;
}> {
  const locale = await getLocale();
  const {
    data: items,
    hasMore,
    error,
  } = await getUserList(listType, { offset });

  if (error) {
    return { data: [], hasMore: false, error };
  }

  const resolved: ResolvedListItem[] = await Promise.all(
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

  return { data: resolved, hasMore, error: null };
}
