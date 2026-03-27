'use client';

import { ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';

import { cn } from '@/lib/utils';
import { useOptimisticHelpful } from '@/hooks/use-optimistic-helpful';
import { StarRating } from '@/components/reviews/star-rating';
import { ReputationBadge } from '@/components/profile/reputation-badge';
import type { ReviewWithVoteStatus } from '@/actions/reviews';

type ReviewCardProps = {
  review: ReviewWithVoteStatus;
  isLoggedIn: boolean;
  /** Whether the current user wrote this review */
  isOwnReview: boolean;
};

/**
 * A single review card with avatar, username, star rating,
 * date, review text, and helpful vote button.
 */
export function ReviewCard({
  review,
  isLoggedIn,
  isOwnReview,
}: ReviewCardProps) {
  const t = useTranslations('reviews');

  const { helpfulCount, hasVoted, isPending, toggleHelpful } =
    useOptimisticHelpful(review.id, {
      helpfulCount: review.helpfulCount,
      hasVoted: review.hasVotedHelpful,
    });

  const timeAgo = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
  });

  const canVote = isLoggedIn && !isOwnReview;

  return (
    <div
      className={cn(
        'bg-card border-primary/20 rounded-2xl border-l-4 p-5 shadow-sm',
        'transition-all duration-300',
        'hover:border-primary/50 hover:shadow-lg',
      )}
    >
      {/* Header: avatar + username + date */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="from-primary/20 to-primary/5 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold">
            {review.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium">{review.username}</p>
              <ReputationBadge reputation={review.reputation} />
            </div>
            <p className="text-muted-foreground text-[11px]">{timeAgo}</p>
          </div>
        </div>

        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="mb-1 text-sm font-semibold">{review.title}</h4>
      )}

      {/* Body */}
      {review.body && (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {review.body}
        </p>
      )}

      {/* Helpful vote */}
      <div className="mt-3 flex items-center gap-1.5">
        <button
          onClick={canVote ? toggleHelpful : undefined}
          disabled={isPending || !canVote}
          title={
            !isLoggedIn
              ? t('loginToVote')
              : isOwnReview
                ? t('cannotVoteOwn')
                : hasVoted
                  ? t('removeHelpful')
                  : t('markHelpful')
          }
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
            hasVoted
              ? 'bg-primary text-primary-foreground shadow-primary/25 shadow-sm'
              : 'bg-primary/5 text-muted-foreground hover:bg-primary/15 hover:text-primary',
            (!canVote || isPending) && 'cursor-not-allowed opacity-50',
          )}
        >
          <ThumbsUp className="size-3.5" />
          <span className="font-medium">
            {helpfulCount > 0
              ? t('helpfulCount', { count: helpfulCount })
              : t('helpful')}
          </span>
        </button>
      </div>
    </div>
  );
}
