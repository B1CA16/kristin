'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getUser } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/sanitize';
import { logActivity } from '@/actions/activity';

import type { MediaRef } from '@/types/media';

export type SuggestionWithVoteStatus = {
  id: string;
  targetTmdbId: number;
  targetType: 'movie' | 'tv';
  reason: string | null;
  voteCount: number;
  suggestedBy: string;
  suggestedByUsername: string;
  suggestedByReputation: number;
  createdAt: string;
  hasVoted: boolean;
  /** True when this suggestion was created from the other media's page. */
  isReverse: boolean;
};

// ---------------------------------------------------------------------------
// getSuggestionsForMedia
// ---------------------------------------------------------------------------

/**
 * Get all community suggestions for a given media item.
 *
 * Returns both forward suggestions (A → B, showing B on A's page)
 * and reverse suggestions (B → A, also showing B on A's page).
 * This means if someone suggests Show B on Show A, Show A also
 * appears as a recommendation on Show B's page automatically.
 *
 * Sorted by vote count (highest first), with user vote status.
 */
export async function getSuggestionsForMedia(
  source: MediaRef,
): Promise<{ data: SuggestionWithVoteStatus[]; error: string | null }> {
  const supabase = await createClient();
  const user = await getUser();

  // Fetch forward suggestions (source → target)
  const { data: forward, error: fwdError } = await supabase
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
      profiles!community_suggestions_suggested_by_fkey (username, reputation)
    `,
    )
    .eq('source_tmdb_id', source.tmdbId)
    .eq('source_type', source.mediaType)
    .order('vote_count', { ascending: false });

  if (fwdError) {
    return { data: [], error: fwdError.message };
  }

  // Fetch reverse suggestions (this media is the target — show the source)
  const { data: reverse, error: revError } = await supabase
    .from('community_suggestions')
    .select(
      `
      id,
      source_tmdb_id,
      source_type,
      reason,
      vote_count,
      suggested_by,
      created_at,
      profiles!community_suggestions_suggested_by_fkey (username, reputation)
    `,
    )
    .eq('target_tmdb_id', source.tmdbId)
    .eq('target_type', source.mediaType)
    .order('vote_count', { ascending: false });

  if (revError) {
    return { data: [], error: revError.message };
  }

  // Collect all suggestion IDs for vote lookup
  const allIds = [...forward.map((s) => s.id), ...reverse.map((s) => s.id)];

  let votedSuggestionIds = new Set<string>();
  if (user && allIds.length > 0) {
    const { data: votes } = await supabase
      .from('suggestion_votes')
      .select('suggestion_id')
      .eq('user_id', user.id)
      .in('suggestion_id', allIds);

    votedSuggestionIds = new Set(votes?.map((v) => v.suggestion_id) ?? []);
  }

  type ProfileJoin = { username: string; reputation: number };

  // Map forward suggestions (target is the recommended media)
  const forwardMapped: SuggestionWithVoteStatus[] = forward.map((s) => ({
    id: s.id,
    targetTmdbId: s.target_tmdb_id,
    targetType: s.target_type,
    reason: s.reason,
    voteCount: s.vote_count,
    suggestedBy: s.suggested_by,
    suggestedByUsername:
      (s.profiles as unknown as ProfileJoin)?.username ?? 'unknown',
    suggestedByReputation:
      (s.profiles as unknown as ProfileJoin)?.reputation ?? 0,
    createdAt: s.created_at,
    hasVoted: votedSuggestionIds.has(s.id),
    isReverse: false,
  }));

  // Map reverse suggestions (source becomes the "target" to display)
  // Deduplicate: skip if the same media pair already exists in forward
  const forwardPairs = new Set(
    forward.map((s) => `${s.target_type}-${s.target_tmdb_id}`),
  );

  const reverseMapped: SuggestionWithVoteStatus[] = reverse
    .filter((s) => !forwardPairs.has(`${s.source_type}-${s.source_tmdb_id}`))
    .map((s) => ({
      id: s.id,
      targetTmdbId: s.source_tmdb_id,
      targetType: s.source_type,
      reason: s.reason,
      voteCount: s.vote_count,
      suggestedBy: s.suggested_by,
      suggestedByUsername:
        (s.profiles as unknown as ProfileJoin)?.username ?? 'unknown',
      suggestedByReputation:
        (s.profiles as unknown as ProfileJoin)?.reputation ?? 0,
      createdAt: s.created_at,
      hasVoted: votedSuggestionIds.has(s.id),
      isReverse: true,
    }));

  // Merge and sort by vote count
  const merged = [...forwardMapped, ...reverseMapped].sort(
    (a, b) => b.voteCount - a.voteCount,
  );

  return { data: merged, error: null };
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

  // Check for reverse duplicate — if target→source already exists,
  // block the suggestion since bidirectional display makes it redundant
  const { data: reverseExists } = await supabase
    .from('community_suggestions')
    .select('id')
    .eq('source_tmdb_id', target.tmdbId)
    .eq('source_type', target.mediaType)
    .eq('target_tmdb_id', source.tmdbId)
    .eq('target_type', source.mediaType)
    .limit(1);

  if (reverseExists && reverseExists.length > 0) {
    return { error: 'This suggestion already exists.' };
  }

  const { error } = await supabase.from('community_suggestions').insert({
    source_tmdb_id: source.tmdbId,
    source_type: source.mediaType,
    target_tmdb_id: target.tmdbId,
    target_type: target.mediaType,
    reason: sanitizeText(reason),
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
