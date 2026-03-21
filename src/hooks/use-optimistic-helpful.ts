import { useCallback, useOptimistic, useTransition } from 'react';
import { voteReviewHelpful, unvoteReviewHelpful } from '@/actions/reviews';

type HelpfulState = {
  helpfulCount: number;
  hasVoted: boolean;
};

/**
 * Manages optimistic "helpful" voting on a review.
 *
 * Updates the UI immediately on click, then calls the server action.
 * If the server action fails, React automatically rolls back
 * the optimistic state to the real state.
 */
export function useOptimisticHelpful(
  reviewId: string,
  initialState: HelpfulState,
) {
  const [isPending, startTransition] = useTransition();

  const [optimisticState, setOptimisticState] = useOptimistic(
    initialState,
    (_current: HelpfulState, action: 'vote' | 'unvote') => ({
      helpfulCount: _current.helpfulCount + (action === 'vote' ? 1 : -1),
      hasVoted: action === 'vote',
    }),
  );

  const toggleHelpful = useCallback(() => {
    const action = optimisticState.hasVoted ? 'unvote' : 'vote';

    startTransition(async () => {
      setOptimisticState(action);

      const { error } =
        action === 'vote'
          ? await voteReviewHelpful(reviewId)
          : await unvoteReviewHelpful(reviewId);

      if (error) {
        console.error('Helpful vote error:', error);
      }
    });
  }, [optimisticState.hasVoted, reviewId, setOptimisticState]);

  return {
    helpfulCount: optimisticState.helpfulCount,
    hasVoted: optimisticState.hasVoted,
    isPending,
    toggleHelpful,
  };
}
