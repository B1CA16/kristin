'use client';

import { useCallback, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import dynamic from 'next/dynamic';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { ReviewCard } from '@/components/reviews/review-card';

const ReviewForm = dynamic(() =>
  import('@/components/reviews/review-form').then((m) => ({
    default: m.ReviewForm,
  })),
);
import { getReviewsForMedia } from '@/actions/reviews';
import type { ReviewWithVoteStatus, ReviewSortOption } from '@/actions/reviews';

type ReviewListProps = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  initialReviews: ReviewWithVoteStatus[];
  initialTotal: number;
  initialHasMore: boolean;
  isLoggedIn: boolean;
  currentUserId?: string;
  /** Pre-fetched current user's review for edit mode */
  existingReview?: {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
  } | null;
};

const SORT_OPTIONS: ReviewSortOption[] = [
  'helpful',
  'newest',
  'highest',
  'lowest',
];

/**
 * Full review list with sort options, pagination (load more),
 * and write/edit review button.
 *
 * Uses server-provided data by default. Switches to client-managed
 * state only after user interaction (sort, load more, or review submit).
 */
export function ReviewList({
  tmdbId,
  mediaType,
  initialReviews,
  initialTotal,
  initialHasMore,
  isLoggedIn,
  currentUserId,
  existingReview,
}: ReviewListProps) {
  const t = useTranslations('reviews');

  const [hasInteracted, setHasInteracted] = useState(false);
  const [clientReviews, setClientReviews] =
    useState<ReviewWithVoteStatus[]>(initialReviews);
  const [clientTotal, setClientTotal] = useState(initialTotal);
  const [clientHasMore, setClientHasMore] = useState(initialHasMore);
  const [sort, setSort] = useState<ReviewSortOption>('helpful');
  const [isPending, startTransition] = useTransition();

  // Use server data until user interacts, then switch to client state
  const reviews = hasInteracted ? clientReviews : initialReviews;
  const total = hasInteracted ? clientTotal : initialTotal;
  const hasMore = hasInteracted ? clientHasMore : initialHasMore;

  const fetchReviews = useCallback(
    (fetchSort: ReviewSortOption, offset: number, append: boolean) => {
      setHasInteracted(true);
      startTransition(async () => {
        const result = await getReviewsForMedia(
          { tmdbId, mediaType },
          { sort: fetchSort, offset },
        );
        if (!result.error) {
          setClientReviews((prev) =>
            append ? [...prev, ...result.data] : result.data,
          );
          setClientTotal(result.total);
          setClientHasMore(result.hasMore);
        }
      });
    },
    [tmdbId, mediaType],
  );

  const handleSortChange = useCallback(
    (newSort: ReviewSortOption) => {
      if (newSort === sort) return;
      setSort(newSort);
      fetchReviews(newSort, 0, false);
    },
    [sort, fetchReviews],
  );

  const handleLoadMore = useCallback(() => {
    fetchReviews(sort, reviews.length, true);
  }, [sort, reviews.length, fetchReviews]);

  const handleReviewSuccess = useCallback(() => {
    fetchReviews(sort, 0, false);
  }, [sort, fetchReviews]);

  return (
    <div>
      {/* Header: title + write review button */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">
          {t('heading')}
          {total > 0 && (
            <span className="text-muted-foreground ml-1.5 text-sm font-normal">
              ({total})
            </span>
          )}
        </h2>
        <ReviewForm
          tmdbId={tmdbId}
          mediaType={mediaType}
          isLoggedIn={isLoggedIn}
          existingReview={existingReview}
          onSuccess={handleReviewSuccess}
        />
      </div>

      {/* Sort tabs */}
      {reviews.length > 0 && (
        <div className="mb-4 flex gap-1">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => handleSortChange(option)}
              disabled={isPending}
              className={cn(
                'cursor-pointer rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-200',
                sort === option
                  ? 'bg-primary text-primary-foreground shadow-primary/25 shadow-md'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
              )}
            >
              {t(`sort.${option}`)}
            </button>
          ))}
        </div>
      )}

      {/* Review cards */}
      {reviews.length === 0 ? (
        <EmptyState icon={MessageSquare} message={t('noReviews')} />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isLoggedIn={isLoggedIn}
              isOwnReview={review.userId === currentUserId}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? t('loading') : t('loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
}
