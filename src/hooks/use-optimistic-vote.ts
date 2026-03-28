import { useCallback, useOptimistic, useTransition } from 'react';
import { voteSuggestion, unvoteSuggestion } from '@/actions/suggestions';
import { trackEvent } from '@/lib/analytics';

type VoteState = {
  voteCount: number;
  hasVoted: boolean;
};

/**
 * Manages optimistic voting on a suggestion.
 *
 * Updates the UI immediately on click, then calls the server action.
 * If the server action fails, React automatically rolls back
 * the optimistic state to the real state.
 */
export function useOptimisticVote(
  suggestionId: string,
  initialState: VoteState,
) {
  const [isPending, startTransition] = useTransition();

  const [optimisticState, setOptimisticState] = useOptimistic(
    initialState,
    (_current: VoteState, action: 'vote' | 'unvote') => ({
      voteCount: _current.voteCount + (action === 'vote' ? 1 : -1),
      hasVoted: action === 'vote',
    }),
  );

  const toggleVote = useCallback(() => {
    const action = optimisticState.hasVoted ? 'unvote' : 'vote';

    startTransition(async () => {
      setOptimisticState(action);

      const { error } =
        action === 'vote'
          ? await voteSuggestion(suggestionId)
          : await unvoteSuggestion(suggestionId);

      if (error) {
        // On error, React rolls back optimistic state automatically
        // when the transition completes without updating real state.
        console.error('Vote error:', error);
      } else {
        trackEvent('suggestion_voted', {
          suggestion_id: suggestionId,
          action,
        });
      }
    });
  }, [optimisticState.hasVoted, suggestionId, setOptimisticState]);

  return {
    voteCount: optimisticState.voteCount,
    hasVoted: optimisticState.hasVoted,
    isPending,
    toggleVote,
  };
}
