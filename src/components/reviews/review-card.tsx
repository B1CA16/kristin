'use client';

import { ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';

import { cn } from '@/lib/utils';
import { useOptimisticHelpful } from '@/hooks/use-optimistic-helpful';
import { StarRating } from '@/components/reviews/star-rating';
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
        'bg-card ring-border rounded-lg p-4 ring-1',
        'transition-all duration-200',
      )}
    >
      {/* Header: avatar + username + date */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase">
            {review.username.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{review.username}</p>
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
            'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
            hasVoted
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-accent text-muted-foreground',
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
