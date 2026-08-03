import { describe, it, expect } from 'vitest';
import { mediaKey, undirectedPairKey } from '@/lib/suggestions/pair';

describe('mediaKey', () => {
  it('namespaces the id by media type', () => {
    expect(mediaKey('movie', 550)).toBe('movie-550');
    expect(mediaKey('tv', 550)).toBe('tv-550');
  });

  it('does not collide across types with the same id', () => {
    expect(mediaKey('movie', 1)).not.toBe(mediaKey('tv', 1));
  });
});

describe('undirectedPairKey', () => {
  it('is identical for both directions', () => {
    const forward = undirectedPairKey({
      sourceTmdbId: 550,
      sourceType: 'movie',
      targetTmdbId: 807,
      targetType: 'movie',
    });
    const reverse = undirectedPairKey({
      sourceTmdbId: 807,
      sourceType: 'movie',
      targetTmdbId: 550,
      targetType: 'movie',
    });
    expect(forward).toBe(reverse);
  });

  it('distinguishes different pairs', () => {
    const a = undirectedPairKey({
      sourceTmdbId: 550,
      sourceType: 'movie',
      targetTmdbId: 807,
      targetType: 'movie',
    });
    const b = undirectedPairKey({
      sourceTmdbId: 550,
      sourceType: 'movie',
      targetTmdbId: 808,
      targetType: 'movie',
    });
    expect(a).not.toBe(b);
  });

  it('distinguishes a movie pair from a tv pair with the same ids', () => {
    const movies = undirectedPairKey({
      sourceTmdbId: 1,
      sourceType: 'movie',
      targetTmdbId: 2,
      targetType: 'movie',
    });
    const tv = undirectedPairKey({
      sourceTmdbId: 1,
      sourceType: 'tv',
      targetTmdbId: 2,
      targetType: 'tv',
    });
    expect(movies).not.toBe(tv);
  });

  it('distinguishes mixed-type pairs by which side is which', () => {
    const a = undirectedPairKey({
      sourceTmdbId: 1,
      sourceType: 'movie',
      targetTmdbId: 2,
      targetType: 'tv',
    });
    const b = undirectedPairKey({
      sourceTmdbId: 1,
      sourceType: 'tv',
      targetTmdbId: 2,
      targetType: 'movie',
    });
    expect(a).not.toBe(b);
  });
});
