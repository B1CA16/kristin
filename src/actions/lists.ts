'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ListType = 'watchlist' | 'watched' | 'favorite';

type MediaRef = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
};

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

/**
 * Get all items in a user's list, sorted by most recently added.
 */
export async function getUserList(
  listType: ListType,
): Promise<{ data: UserListItem[]; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: 'You must be logged in.' };
  }

  const { data, error } = await supabase
    .from('user_lists')
    .select('id, tmdb_id, media_type, created_at')
    .eq('user_id', user.id)
    .eq('list_type', listType)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  const mapped: UserListItem[] = data.map((row) => ({
    id: row.id,
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    createdAt: row.created_at,
  }));

  return { data: mapped, error: null };
}
