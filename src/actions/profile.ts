'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/sanitize';
import { getMediaBasicInfo } from '@/lib/tmdb';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PublicProfile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  reputation: number;
  publicFavorites: boolean;
  createdAt: string;
  stats: {
    reviewCount: number;
    suggestionCount: number;
    totalVotesReceived: number;
  };
};

export type ProfileReview = {
  id: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  rating: number;
  title: string | null;
  body: string | null;
  helpfulCount: number;
  createdAt: string;
  mediaTitle: string;
  mediaPosterPath: string | null;
};

export type ProfileSuggestion = {
  id: string;
  sourceTmdbId: number;
  sourceType: 'movie' | 'tv';
  targetTmdbId: number;
  targetType: 'movie' | 'tv';
  reason: string | null;
  voteCount: number;
  createdAt: string;
  targetTitle: string;
  targetPosterPath: string | null;
};

export type ProfileFavorite = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROFILE_PAGE_SIZE = 10;

const RESERVED_USERNAMES = new Set([
  'admin',
  'moderator',
  'kristin',
  'profile',
  'settings',
  'api',
  'login',
  'signup',
  'null',
  'undefined',
  'user',
  'support',
  'help',
  'discover',
  'search',
  'browse',
  'lists',
]);

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters.')
  .max(30, 'Username must be at most 30 characters.')
  .regex(
    /^[a-z][a-z0-9_]*$/,
    'Username must start with a letter and contain only lowercase letters, numbers, and underscores.',
  )
  .refine((val) => !RESERVED_USERNAMES.has(val), 'This username is reserved.');

// ---------------------------------------------------------------------------
// getPublicProfile
// ---------------------------------------------------------------------------

/**
 * Get a user's public profile by username, including computed stats.
 */
export async function getPublicProfile(
  username: string,
): Promise<{ data: PublicProfile | null; error: string | null }> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    return { data: null, error: error.message };
  }

  // Compute stats in parallel
  const [reviewResult, suggestionResult] = await Promise.all([
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id),
    supabase
      .from('community_suggestions')
      .select('vote_count')
      .eq('suggested_by', profile.id),
  ]);

  const reviewCount = reviewResult.count ?? 0;
  const suggestions = suggestionResult.data ?? [];
  const suggestionCount = suggestions.length;
  const totalVotesReceived = suggestions.reduce(
    (sum, s) => sum + s.vote_count,
    0,
  );

  return {
    data: {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      reputation: profile.reputation,
      publicFavorites: profile.public_favorites,
      createdAt: profile.created_at,
      stats: { reviewCount, suggestionCount, totalVotesReceived },
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// getProfileActivity
// ---------------------------------------------------------------------------

/**
 * Get paginated activity for a user's profile tabs.
 */
export async function getProfileReviews(
  userId: string,
  options: { offset?: number; limit?: number } = {},
): Promise<{
  data: ProfileReview[];
  hasMore: boolean;
  error: string | null;
}> {
  const supabase = await createClient();
  const locale = await getLocale();
  const offset = options.offset ?? 0;
  const limit = options.limit ?? PROFILE_PAGE_SIZE;

  const { data, error, count } = await supabase
    .from('reviews')
    .select(
      'id, tmdb_id, media_type, rating, title, body, helpful_count, created_at',
      {
        count: 'exact',
      },
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { data: [], hasMore: false, error: error.message };
  }

  const items: ProfileReview[] = await Promise.all(
    data.map(async (r) => {
      let mediaTitle = 'Unknown';
      let mediaPosterPath: string | null = null;
      try {
        const info = await getMediaBasicInfo(r.tmdb_id, r.media_type, {
          locale,
        });
        mediaTitle = info.title;
        mediaPosterPath = info.posterPath;
      } catch {
        // TMDB fetch failed
      }
      return {
        id: r.id,
        tmdbId: r.tmdb_id,
        mediaType: r.media_type,
        rating: r.rating,
        title: r.title,
        body: r.body,
        helpfulCount: r.helpful_count,
        createdAt: r.created_at,
        mediaTitle,
        mediaPosterPath,
      };
    }),
  );

  return {
    data: items,
    hasMore: offset + limit < (count ?? 0),
    error: null,
  };
}

export async function getProfileSuggestions(
  userId: string,
  options: { offset?: number; limit?: number } = {},
): Promise<{
  data: ProfileSuggestion[];
  hasMore: boolean;
  error: string | null;
}> {
  const supabase = await createClient();
  const locale = await getLocale();
  const offset = options.offset ?? 0;
  const limit = options.limit ?? PROFILE_PAGE_SIZE;

  const { data, error, count } = await supabase
    .from('community_suggestions')
    .select(
      'id, source_tmdb_id, source_type, target_tmdb_id, target_type, reason, vote_count, created_at',
      { count: 'exact' },
    )
    .eq('suggested_by', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { data: [], hasMore: false, error: error.message };
  }

  const items: ProfileSuggestion[] = await Promise.all(
    data.map(async (s) => {
      let targetTitle = 'Unknown';
      let targetPosterPath: string | null = null;
      try {
        const info = await getMediaBasicInfo(s.target_tmdb_id, s.target_type, {
          locale,
        });
        targetTitle = info.title;
        targetPosterPath = info.posterPath;
      } catch {
        // TMDB fetch failed
      }
      return {
        id: s.id,
        sourceTmdbId: s.source_tmdb_id,
        sourceType: s.source_type,
        targetTmdbId: s.target_tmdb_id,
        targetType: s.target_type,
        reason: s.reason,
        voteCount: s.vote_count,
        createdAt: s.created_at,
        targetTitle,
        targetPosterPath,
      };
    }),
  );

  return {
    data: items,
    hasMore: offset + limit < (count ?? 0),
    error: null,
  };
}

export async function getProfileFavorites(
  userId: string,
  options: { offset?: number; limit?: number } = {},
): Promise<{
  data: ProfileFavorite[];
  hasMore: boolean;
  error: string | null;
}> {
  const supabase = await createClient();
  const locale = await getLocale();
  const offset = options.offset ?? 0;
  const limit = options.limit ?? PROFILE_PAGE_SIZE;

  const { data, error, count } = await supabase
    .from('user_lists')
    .select('tmdb_id, media_type', { count: 'exact' })
    .eq('user_id', userId)
    .eq('list_type', 'favorite')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { data: [], hasMore: false, error: error.message };
  }

  const items: ProfileFavorite[] = await Promise.all(
    data.map(async (item) => {
      try {
        const info = await getMediaBasicInfo(item.tmdb_id, item.media_type, {
          locale,
        });
        return {
          tmdbId: item.tmdb_id,
          mediaType: item.media_type,
          title: info.title,
          posterPath: info.posterPath,
          releaseDate: info.releaseDate,
          voteAverage: info.voteAverage,
        };
      } catch {
        return {
          tmdbId: item.tmdb_id,
          mediaType: item.media_type,
          title: 'Unknown',
          posterPath: null,
          releaseDate: null,
          voteAverage: null,
        };
      }
    }),
  );

  return {
    data: items,
    hasMore: offset + limit < (count ?? 0),
    error: null,
  };
}

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

/**
 * Update the current user's profile. Username changes have a 30-day cooldown.
 */
export async function updateProfile(input: {
  username?: string;
  displayName?: string;
  bio?: string;
  publicFavorites?: boolean;
}): Promise<{ error: string | null; newUsername?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in.' };
  }

  // Fetch current profile for username cooldown check
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, username_changed_at')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: 'Profile not found.' };
  }

  const updates: Record<string, unknown> = {};

  // Username change
  if (input.username !== undefined && input.username !== profile.username) {
    const parsed = usernameSchema.safeParse(input.username);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    // Check 30-day cooldown
    if (profile.username_changed_at) {
      const lastChange = new Date(profile.username_changed_at);
      const daysSince =
        (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        const daysLeft = Math.ceil(30 - daysSince);
        return {
          error: `You can change your username again in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
        };
      }
    }

    // Check uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', input.username)
      .single();

    if (existing) {
      return { error: 'This username is already taken.' };
    }

    updates.username = input.username;
    updates.username_changed_at = new Date().toISOString();
  }

  if (input.displayName !== undefined) {
    updates.display_name = sanitizeText(input.displayName);
  }

  if (input.bio !== undefined) {
    // Strip HTML tags for XSS prevention
    updates.bio = sanitizeText(input.bio);
  }

  if (input.publicFavorites !== undefined) {
    updates.public_favorites = input.publicFavorites;
  }

  if (Object.keys(updates).length === 0) {
    return { error: null };
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') {
      return { error: 'This username is already taken.' };
    }
    return { error: error.message };
  }

  const newUsername = (updates.username as string) ?? profile.username;
  revalidatePath(`/profile/${newUsername}`);
  return { error: null, newUsername };
}
