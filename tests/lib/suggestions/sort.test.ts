import { describe, it, expect } from 'vitest';
import {
  compareSuggestions,
  type SortableSuggestion,
} from '@/lib/suggestions/sort';

const community = (voteCount: number): SortableSuggestion => ({
  voteCount,
  source: 'community',
  curatedRank: null,
});

const curated = (curatedRank: number): SortableSuggestion => ({
  voteCount: 0,
  source: 'curated',
  curatedRank,
});

describe('compareSuggestions', () => {
  it('ranks community above curated regardless of votes', () => {
    // A zero-vote real suggestion still outranks any seeded one.
    expect(compareSuggestions(community(0), curated(0))).toBeLessThan(0);
    expect(compareSuggestions(curated(0), community(0))).toBeGreaterThan(0);
  });

  it('sorts community by vote count descending', () => {
    expect(compareSuggestions(community(5), community(2))).toBeLessThan(0);
    expect(compareSuggestions(community(2), community(5))).toBeGreaterThan(0);
  });

  it('sorts curated by rank ascending', () => {
    expect(compareSuggestions(curated(0), curated(3))).toBeLessThan(0);
    expect(compareSuggestions(curated(3), curated(0))).toBeGreaterThan(0);
  });

  it('produces a stable full ordering when used with sort()', () => {
    const list = [curated(1), community(3), curated(0), community(9)];
    const sorted = [...list].sort(compareSuggestions);
    expect(sorted).toEqual([
      community(9),
      community(3),
      curated(0),
      curated(1),
    ]);
  });

  it('treats a null curatedRank as last rather than as rank 0', () => {
    // Defensive: the CHECK constraint forbids this, but a comparator that
    // silently coerced null to 0 would promote malformed rows to the top.
    const malformed: SortableSuggestion = {
      voteCount: 0,
      source: 'curated',
      curatedRank: null,
    };
    expect(compareSuggestions(curated(5), malformed)).toBeLessThan(0);
  });
});
