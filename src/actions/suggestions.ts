'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getUser } from '@/lib/supabase/server';
import { logActivity } from '@/actions/activity';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MediaRef = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
};

export type SuggestionWithVoteStatus = {
  id: string;
  targetTmdbId: number;
  targetType: 'movie' | 'tv';
  reason: string | null;
  voteCount: number;
  suggestedBy: string;
  suggestedByUsername: string;
  createdAt: string;
  hasVoted: boolean;
};

// ---------------------------------------------------------------------------
// getSuggestionsForMedia
// ---------------------------------------------------------------------------

/**
 * Get all community suggestions for a given media item.
 * Returns suggestions sorted by vote count (highest first),
 * with whether the current user has voted on each one.
 */
export async function getSuggestionsForMedia(
  source: MediaRef,
): Promise<{ data: SuggestionWithVoteStatus[]; error: string | null }> {
  const supabase = await createClient();
  const user = await getUser();

  const { data: suggestions, error } = await supabase
    .from('community_suggestions')
    .select(
      `
      id,
      target_tmdb_id,
      target_type,
      reason,
      vote_count,
      suggested_by,
      created_at,
      profiles!community_suggestions_suggested_by_fkey (username)
    `,
    )
    .eq('source_tmdb_id', source.tmdbId)
    .eq('source_type', source.mediaType)
    .order('vote_count', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  // If logged in, fetch user's votes to mark which they've voted on
  let votedSuggestionIds = new Set<string>();
  if (user) {
    const suggestionIds = suggestions.map((s) => s.id);
    if (suggestionIds.length > 0) {
      const { data: votes } = await supabase
        .from('suggestion_votes')
        .select('suggestion_id')
        .eq('user_id', user.id)
        .in('suggestion_id', suggestionIds);

      votedSuggestionIds = new Set(votes?.map((v) => v.suggestion_id) ?? []);
    }
  }

  const mapped: SuggestionWithVoteStatus[] = suggestions.map((s) => ({
    id: s.id,
    targetTmdbId: s.target_tmdb_id,
    targetType: s.target_type,
    reason: s.reason,
    voteCount: s.vote_count,
    suggestedBy: s.suggested_by,
    suggestedByUsername:
      (s.profiles as unknown as { username: string })?.username ?? 'unknown',
    createdAt: s.created_at,
    hasVoted: votedSuggestionIds.has(s.id),
  }));

  return { data: mapped, error: null };
}

// ---------------------------------------------------------------------------
// createSuggestion
// ---------------------------------------------------------------------------

/**
 * Create a new community suggestion (A → B).
 * Validates auth, prevents duplicates and self-suggestions.
 */
export async function createSuggestion(
  source: MediaRef,
  target: MediaRef,
  reason?: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to suggest.' };
  }

  // Self-suggestion check (also enforced by DB constraint)
  if (
    source.tmdbId === target.tmdbId &&
    source.mediaType === target.mediaType
  ) {
    return { error: 'Cannot suggest a media item to itself.' };
  }

  const { error } = await supabase.from('community_suggestions').insert({
    source_tmdb_id: source.tmdbId,
    source_type: source.mediaType,
    target_tmdb_id: target.tmdbId,
    target_type: target.mediaType,
    reason: reason?.trim() || null,
    suggested_by: user.id,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'This suggestion already exists.' };
    }
    return { error: error.message };
  }

  void logActivity({
    userId: user.id,
    tmdbId: source.tmdbId,
    mediaType: source.mediaType,
    action: 'suggestion_created',
  });

  revalidatePath(`/${source.mediaType}/${source.tmdbId}`);
  return { error: null };
}

// ---------------------------------------------------------------------------
// voteSuggestion
// ---------------------------------------------------------------------------

/**
 * Upvote a suggestion. The DB trigger automatically updates
 * vote_count and the suggester's reputation.
 */
export async function voteSuggestion(
  suggestionId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to vote.' };
  }

  // Prevent self-voting
  const { data: suggestion } = await supabase
    .from('community_suggestions')
    .select('suggested_by, source_type, source_tmdb_id')
    .eq('id', suggestionId)
    .single();

  if (suggestion?.suggested_by === user.id) {
    return { error: 'You cannot vote on your own suggestion.' };
  }

  const { error } = await supabase.from('suggestion_votes').insert({
    suggestion_id: suggestionId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'You have already voted on this suggestion.' };
    }
    return { error: error.message };
  }

  if (suggestion) {
    void logActivity({
      userId: user.id,
      tmdbId: suggestion.source_tmdb_id,
      mediaType: suggestion.source_type,
      action: 'suggestion_voted',
    });

    revalidatePath(`/${suggestion.source_type}/${suggestion.source_tmdb_id}`);
  }
  return { error: null };
}

// ---------------------------------------------------------------------------
// unvoteSuggestion
// ---------------------------------------------------------------------------

/**
 * Remove a vote from a suggestion. The DB trigger automatically
 * decrements vote_count and updates the suggester's reputation.
 */
export async function unvoteSuggestion(
  suggestionId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to remove your vote.' };
  }

  // Fetch source info for revalidation
  const { data: suggestion } = await supabase
    .from('community_suggestions')
    .select('source_type, source_tmdb_id')
    .eq('id', suggestionId)
    .single();

  const { error } = await supabase
    .from('suggestion_votes')
    .delete()
    .eq('suggestion_id', suggestionId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  if (suggestion) {
    revalidatePath(`/${suggestion.source_type}/${suggestion.source_tmdb_id}`);
  }
  return { error: null };
}
