'use server';

import { createClient } from '@/lib/supabase/server';
import { getMediaBasicInfo } from '@/lib/tmdb';
import { getLocale } from 'next-intl/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TrendingItem = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  activityScore: number;
};

type PopularSuggestion = {
  targetTmdbId: number;
  targetType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  voteCount: number;
};

// ---------------------------------------------------------------------------
// Activity weights — intentional actions rank higher than passive ones
// ---------------------------------------------------------------------------

const ACTION_WEIGHTS: Record<string, number> = {
  review_created: 5,
  suggestion_created: 4,
  suggestion_voted: 2,
  review_helpful_voted: 2,
  favorite_added: 3,
  watched_added: 2,
  watchlist_added: 1,
};

// ---------------------------------------------------------------------------
// getTrendingOnKristin
// ---------------------------------------------------------------------------

/**
 * Aggregate activity_log for the last 7 days, weighted by action type.
 * Returns top media sorted by weighted activity score.
 */
export async function getTrendingOnKristin(
  limit = 12,
): Promise<{ data: TrendingItem[]; error: string | null }> {
  const supabase = await createClient();
  const locale = await getLocale();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: logs, error } = await supabase
    .from('activity_log')
    .select('tmdb_id, media_type, action')
    .gte('created_at', sevenDaysAgo.toISOString());

  if (error) {
    return { data: [], error: error.message };
  }

  // Aggregate weighted scores per media
  const scores = new Map<
    string,
    { tmdbId: number; mediaType: 'movie' | 'tv'; score: number }
  >();

  for (const log of logs) {
    const key = `${log.media_type}-${log.tmdb_id}`;
    const weight = ACTION_WEIGHTS[log.action] ?? 1;
    const existing = scores.get(key);

    if (existing) {
      existing.score += weight;
    } else {
      scores.set(key, {
        tmdbId: log.tmdb_id,
        mediaType: log.media_type,
        score: weight,
      });
    }
  }

  // Sort by score and take top N
  const sorted = [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Resolve TMDB info
  const items: TrendingItem[] = await Promise.all(
    sorted.map(async (entry) => {
      try {
        const info = await getMediaBasicInfo(entry.tmdbId, entry.mediaType, {
          locale,
        });
        return {
          tmdbId: entry.tmdbId,
          mediaType: entry.mediaType,
          title: info.title,
          posterPath: info.posterPath,
          releaseDate: info.releaseDate,
          voteAverage: info.voteAverage,
          activityScore: entry.score,
        };
      } catch {
        return {
          tmdbId: entry.tmdbId,
          mediaType: entry.mediaType,
          title: 'Unknown',
          posterPath: null,
          releaseDate: null,
          voteAverage: null,
          activityScore: entry.score,
        };
      }
    }),
  );

  return { data: items, error: null };
}

// ---------------------------------------------------------------------------
// getPopularRecommendations
// ---------------------------------------------------------------------------

/**
 * Get the highest-voted community suggestions across all media.
 * Returns unique target media sorted by vote count.
 */
export async function getPopularRecommendations(
  limit = 12,
): Promise<{ data: PopularSuggestion[]; error: string | null }> {
  const supabase = await createClient();
  const locale = await getLocale();

  const { data: suggestions, error } = await supabase
    .from('community_suggestions')
    .select('target_tmdb_id, target_type, vote_count')
    .order('vote_count', { ascending: false })
    .limit(limit * 2); // Fetch extra to account for deduplication

  if (error) {
    return { data: [], error: error.message };
  }

  // Deduplicate by target media (same media can be suggested on multiple pages)
  const seen = new Set<string>();
  const unique = suggestions
    .filter((s) => {
      const key = `${s.target_type}-${s.target_tmdb_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);

  // Resolve TMDB info
  const items: PopularSuggestion[] = await Promise.all(
    unique.map(async (s) => {
      try {
        const info = await getMediaBasicInfo(s.target_tmdb_id, s.target_type, {
          locale,
        });
        return {
          targetTmdbId: s.target_tmdb_id,
          targetType: s.target_type,
          title: info.title,
          posterPath: info.posterPath,
          releaseDate: info.releaseDate,
          voteAverage: info.voteAverage,
          voteCount: s.vote_count,
        };
      } catch {
        return {
          targetTmdbId: s.target_tmdb_id,
          targetType: s.target_type,
          title: 'Unknown',
          posterPath: null,
          releaseDate: null,
          voteAverage: null,
          voteCount: s.vote_count,
        };
      }
    }),
  );

  return { data: items, error: null };
}
