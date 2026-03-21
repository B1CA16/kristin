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

export type ReviewWithVoteStatus = {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  helpfulCount: number;
  hasVotedHelpful: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReviewSortOption = 'helpful' | 'newest' | 'highest' | 'lowest';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REVIEWS_PAGE_SIZE = 5;

// ---------------------------------------------------------------------------
// getRatingDistribution
// ---------------------------------------------------------------------------

/**
 * Get all ratings for a media item (just the rating column, no joins).
 * Used by RatingDistribution to show the full breakdown, not just
 * the first page of reviews.
 */
export async function getRatingDistribution(media: MediaRef): Promise<{
  data: number[];
  total: number;
  average: number;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('tmdb_id', media.tmdbId)
    .eq('media_type', media.mediaType);

  if (error) {
    return { data: [], total: 0, average: 0, error: error.message };
  }

  const ratings = data.map((r) => r.rating);
  const total = ratings.length;
  const average =
    total > 0 ? ratings.reduce((sum, r) => sum + r, 0) / total : 0;

  return { data: ratings, total, average, error: null };
}

// ---------------------------------------------------------------------------
// getReviewsForMedia
// ---------------------------------------------------------------------------

/**
 * Get paginated reviews for a media item with the current user's
 * helpful-vote status on each review.
 */
export async function getReviewsForMedia(
  media: MediaRef,
  options: { sort?: ReviewSortOption; offset?: number; limit?: number } = {},
): Promise<{
  data: ReviewWithVoteStatus[];
  total: number;
  hasMore: boolean;
  error: string | null;
}> {
  const supabase = await createClient();
  const sort = options.sort ?? 'helpful';
  const offset = options.offset ?? 0;
  const limit = options.limit ?? REVIEWS_PAGE_SIZE;

  const user = await getUser();

  // Build sort clause
  let orderColumn: string;
  let ascending: boolean;
  switch (sort) {
    case 'newest':
      orderColumn = 'created_at';
      ascending = false;
      break;
    case 'highest':
      orderColumn = 'rating';
      ascending = false;
      break;
    case 'lowest':
      orderColumn = 'rating';
      ascending = true;
      break;
    case 'helpful':
    default:
      orderColumn = 'helpful_count';
      ascending = false;
      break;
  }

  const {
    data: reviews,
    error,
    count,
  } = await supabase
    .from('reviews')
    .select(
      `
      id,
      user_id,
      rating,
      title,
      body,
      helpful_count,
      created_at,
      updated_at,
      profiles!reviews_user_id_fkey (username, avatar_url)
    `,
      { count: 'exact' },
    )
    .eq('tmdb_id', media.tmdbId)
    .eq('media_type', media.mediaType)
    .order(orderColumn, { ascending })
    .range(offset, offset + limit - 1);

  if (error) {
    return { data: [], total: 0, hasMore: false, error: error.message };
  }

  // Fetch current user's helpful votes
  let votedReviewIds = new Set<string>();
  if (user && reviews.length > 0) {
    const reviewIds = reviews.map((r) => r.id);
    const { data: votes } = await supabase
      .from('review_votes')
      .select('review_id')
      .eq('user_id', user.id)
      .in('review_id', reviewIds);

    votedReviewIds = new Set(votes?.map((v) => v.review_id) ?? []);
  }

  const total = count ?? 0;
  const mapped: ReviewWithVoteStatus[] = reviews.map((r) => {
    const profile = r.profiles as unknown as {
      username: string;
      avatar_url: string | null;
    };
    return {
      id: r.id,
      userId: r.user_id,
      username: profile?.username ?? 'unknown',
      avatarUrl: profile?.avatar_url ?? null,
      rating: r.rating,
      title: r.title,
      body: r.body,
      helpfulCount: r.helpful_count,
      hasVotedHelpful: votedReviewIds.has(r.id),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  return {
    data: mapped,
    total,
    hasMore: offset + limit < total,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// getUserReview
// ---------------------------------------------------------------------------

/**
 * Get the current user's review for a specific media item.
 * Returns null if the user hasn't reviewed it.
 */
export async function getUserReview(media: MediaRef): Promise<{
  data: {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
  } | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, title, body')
    .eq('user_id', user.id)
    .eq('tmdb_id', media.tmdbId)
    .eq('media_type', media.mediaType)
    .single();

  if (error) {
    // PGRST116 = no rows found — not an error for this use case
    if (error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// ---------------------------------------------------------------------------
// createReview
// ---------------------------------------------------------------------------

/**
 * Create a new review for a media item. One review per user per media
 * (enforced by DB unique constraint).
 */
export async function createReview(
  media: MediaRef,
  input: { rating: number; title?: string; body?: string },
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to write a review.' };
  }

  // Validate rating
  if (
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 10
  ) {
    return { error: 'Rating must be an integer between 1 and 10.' };
  }

  const { error } = await supabase.from('reviews').insert({
    user_id: user.id,
    tmdb_id: media.tmdbId,
    media_type: media.mediaType,
    rating: input.rating,
    title: input.title?.trim() || null,
    body: input.body?.trim() || null,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'You have already reviewed this title.' };
    }
    return { error: error.message };
  }

  void logActivity({
    userId: user.id,
    tmdbId: media.tmdbId,
    mediaType: media.mediaType,
    action: 'review_created',
  });

  revalidatePath(`/${media.mediaType}/${media.tmdbId}`);
  return { error: null };
}

// ---------------------------------------------------------------------------
// updateReview
// ---------------------------------------------------------------------------

/**
 * Update the current user's existing review.
 */
export async function updateReview(
  reviewId: string,
  input: { rating: number; title?: string; body?: string },
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in.' };
  }

  if (
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 10
  ) {
    return { error: 'Rating must be an integer between 1 and 10.' };
  }

  // RLS enforces ownership, but we also fetch for revalidation path
  const { data: review } = await supabase
    .from('reviews')
    .select('tmdb_id, media_type, user_id')
    .eq('id', reviewId)
    .single();

  if (!review) {
    return { error: 'Review not found.' };
  }

  if (review.user_id !== user.id) {
    return { error: 'You can only edit your own reviews.' };
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      rating: input.rating,
      title: input.title?.trim() || null,
      body: input.body?.trim() || null,
    })
    .eq('id', reviewId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${review.media_type}/${review.tmdb_id}`);
  return { error: null };
}

// ---------------------------------------------------------------------------
// deleteReview
// ---------------------------------------------------------------------------

/**
 * Delete the current user's review.
 */
export async function deleteReview(
  reviewId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in.' };
  }

  // Fetch for ownership check + revalidation path
  const { data: review } = await supabase
    .from('reviews')
    .select('tmdb_id, media_type, user_id')
    .eq('id', reviewId)
    .single();

  if (!review) {
    return { error: 'Review not found.' };
  }

  if (review.user_id !== user.id) {
    return { error: 'You can only delete your own reviews.' };
  }

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${review.media_type}/${review.tmdb_id}`);
  return { error: null };
}

// ---------------------------------------------------------------------------
// voteReviewHelpful
// ---------------------------------------------------------------------------

/**
 * Mark a review as helpful. DB trigger updates helpful_count.
 * Users cannot vote on their own reviews.
 */
export async function voteReviewHelpful(
  reviewId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to vote.' };
  }

  // Prevent self-voting
  const { data: review } = await supabase
    .from('reviews')
    .select('user_id, tmdb_id, media_type')
    .eq('id', reviewId)
    .single();

  if (!review) {
    return { error: 'Review not found.' };
  }

  if (review.user_id === user.id) {
    return { error: 'You cannot vote on your own review.' };
  }

  const { error } = await supabase.from('review_votes').insert({
    review_id: reviewId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'You have already voted on this review.' };
    }
    return { error: error.message };
  }

  void logActivity({
    userId: user.id,
    tmdbId: review.tmdb_id,
    mediaType: review.media_type,
    action: 'review_helpful_voted',
  });

  revalidatePath(`/${review.media_type}/${review.tmdb_id}`);
  return { error: null };
}

// ---------------------------------------------------------------------------
// unvoteReviewHelpful
// ---------------------------------------------------------------------------

/**
 * Remove a helpful vote from a review. DB trigger decrements helpful_count.
 */
export async function unvoteReviewHelpful(
  reviewId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to remove your vote.' };
  }

  // Fetch for revalidation path
  const { data: review } = await supabase
    .from('reviews')
    .select('tmdb_id, media_type')
    .eq('id', reviewId)
    .single();

  const { error } = await supabase
    .from('review_votes')
    .delete()
    .eq('review_id', reviewId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  if (review) {
    revalidatePath(`/${review.media_type}/${review.tmdb_id}`);
  }
  return { error: null };
}
