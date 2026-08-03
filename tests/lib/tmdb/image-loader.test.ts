import { describe, it, expect } from 'vitest';
import tmdbImageLoader from '@/lib/tmdb/image-loader';
import { posterUrl, backdropUrl, profileUrl, logoUrl } from '@/lib/tmdb/image';

const PATH = '/abc123.jpg';

describe('tmdbImageLoader', () => {
  describe('bucket selection', () => {
    it('picks the smallest poster bucket that covers the requested width', () => {
      const src = posterUrl(PATH, 'xs')!;
      expect(tmdbImageLoader({ src, width: 200 })).toBe(
        `https://image.tmdb.org/t/p/w342${PATH}`,
      );
    });

    it('uses an exact bucket when the width matches one', () => {
      const src = posterUrl(PATH, 'xs')!;
      expect(tmdbImageLoader({ src, width: 500 })).toBe(
        `https://image.tmdb.org/t/p/w500${PATH}`,
      );
    });

    it('caps at the largest bucket instead of requesting a size TMDB does not serve', () => {
      // next/image asks for deviceSizes up to 3840; TMDB has no poster wider
      // than 780, and requesting w3840 would 404.
      const src = posterUrl(PATH, 'xs')!;
      expect(tmdbImageLoader({ src, width: 3840 })).toBe(
        `https://image.tmdb.org/t/p/w780${PATH}`,
      );
    });

    it('can downgrade below the size the component asked for', () => {
      // The size argument is a floor only for non-next/image consumers; the
      // loader is free to serve a smaller file to a small slot.
      const src = posterUrl(PATH, 'xxl')!;
      expect(tmdbImageLoader({ src, width: 100 })).toBe(
        `https://image.tmdb.org/t/p/w154${PATH}`,
      );
    });
  });

  describe('per-kind bucket lists', () => {
    it('uses backdrop buckets for backdrops', () => {
      const src = backdropUrl(PATH, 'sm')!;
      expect(tmdbImageLoader({ src, width: 1000 })).toBe(
        `https://image.tmdb.org/t/p/w1280${PATH}`,
      );
    });

    it('does not give a backdrop a poster-only width', () => {
      // 342 and 500 are valid posters but not valid backdrops.
      const src = backdropUrl(PATH, 'sm')!;
      expect(tmdbImageLoader({ src, width: 400 })).toBe(
        `https://image.tmdb.org/t/p/w780${PATH}`,
      );
    });

    it('uses logo buckets for logos', () => {
      const src = logoUrl(PATH, 'sm')!;
      expect(tmdbImageLoader({ src, width: 120 })).toBe(
        `https://image.tmdb.org/t/p/w154${PATH}`,
      );
    });

    it('caps profiles at their largest width bucket', () => {
      const src = profileUrl(PATH, 'sm')!;
      expect(tmdbImageLoader({ src, width: 1000 })).toBe(
        `https://image.tmdb.org/t/p/w185${PATH}`,
      );
    });
  });

  describe('pass-through cases', () => {
    it('honours an explicit non-width size rather than rewriting it', () => {
      const src = posterUrl(PATH, 'original')!;
      expect(tmdbImageLoader({ src, width: 200 })).toBe(
        `https://image.tmdb.org/t/p/original${PATH}`,
      );
    });

    it('honours the h632 profile size', () => {
      const src = profileUrl(PATH, 'lg')!;
      expect(tmdbImageLoader({ src, width: 200 })).toBe(
        `https://image.tmdb.org/t/p/h632${PATH}`,
      );
    });

    it('leaves local assets untouched', () => {
      expect(tmdbImageLoader({ src: '/logo.svg', width: 64 })).toBe(
        '/logo.svg',
      );
    });

    it('leaves untagged remote URLs untouched, e.g. Supabase avatars', () => {
      const src = 'https://example.supabase.co/storage/v1/object/public/a.png';
      expect(tmdbImageLoader({ src, width: 64 })).toBe(src);
    });

    it('strips an unrecognised kind tag instead of forwarding it', () => {
      const src = `https://image.tmdb.org/t/p/w342${PATH}?k=bogus`;
      expect(tmdbImageLoader({ src, width: 300 })).toBe(
        `https://image.tmdb.org/t/p/w342${PATH}`,
      );
    });

    it('never forwards the kind tag to TMDB', () => {
      const src = posterUrl(PATH, 'lg')!;
      expect(tmdbImageLoader({ src, width: 300 })).not.toContain('k=');
    });
  });

  describe('url builders', () => {
    it('tags each builder with its own kind', () => {
      expect(posterUrl(PATH)).toContain('?k=poster');
      expect(backdropUrl(PATH)).toContain('?k=backdrop');
      expect(profileUrl(PATH)).toContain('?k=profile');
      expect(logoUrl(PATH)).toContain('?k=logo');
    });

    it('returns null for a missing path so callers can render a fallback', () => {
      expect(posterUrl(null)).toBeNull();
      expect(backdropUrl(null)).toBeNull();
      expect(profileUrl(null)).toBeNull();
      expect(logoUrl(null)).toBeNull();
    });
  });
});
