/**
 * Media pair identity helpers.
 *
 * A suggestion is stored directionally (source → target), but the app treats
 * A→B and B→A as the same recommendation: `createSuggestion` rejects the reverse
 * of an existing pair, and reads surface both directions. Anything writing
 * suggestions outside the server actions — notably the seed script — must
 * respect that, so the "are these the same pair?" rule lives here rather than
 * being reimplemented per caller.
 */

export type MediaType = 'movie' | 'tv';

export type MediaPair = {
  sourceTmdbId: number;
  sourceType: MediaType;
  targetTmdbId: number;
  targetType: MediaType;
};

/** Type-namespaced media identity. TMDB reuses ids across movies and TV. */
export function mediaKey(mediaType: MediaType, tmdbId: number): string {
  return `${mediaType}-${tmdbId}`;
}

/**
 * Direction-independent key for a pair. Sorting the two media keys means A→B
 * and B→A collapse to the same string, which is what makes reverse-duplicate
 * detection a set lookup.
 */
export function undirectedPairKey(pair: MediaPair): string {
  const a = mediaKey(pair.sourceType, pair.sourceTmdbId);
  const b = mediaKey(pair.targetType, pair.targetTmdbId);
  return [a, b].sort().join('|');
}
