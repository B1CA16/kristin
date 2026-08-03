/**
 * Ordering for the merged suggestion list.
 *
 * Community suggestions always precede curated ones, so a single real
 * contribution is never buried under seeded content. Sorting by vote count
 * alone would not achieve that: curated rows carry no votes by design, so they
 * would interleave with new zero-vote real suggestions.
 */

export type SortableSuggestion = {
  voteCount: number;
  source: 'community' | 'curated';
  curatedRank: number | null;
};

/** Sort last, not first — a missing rank must never win. */
const RANK_LAST = Number.MAX_SAFE_INTEGER;

export function compareSuggestions(
  a: SortableSuggestion,
  b: SortableSuggestion,
): number {
  if (a.source !== b.source) {
    return a.source === 'community' ? -1 : 1;
  }

  if (a.source === 'community') {
    return b.voteCount - a.voteCount;
  }

  return (a.curatedRank ?? RANK_LAST) - (b.curatedRank ?? RANK_LAST);
}
