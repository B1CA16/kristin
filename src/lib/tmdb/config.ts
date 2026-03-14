/**
 * TMDB API configuration constants.
 * Image base URL is public (used in <img> src), API key is server-only.
 */

export const TMDB_API_BASE = 'https://api.themoviedb.org/3';

export const TMDB_IMAGE_BASE =
  process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

/** Poster sizes available from TMDB CDN. */
export const POSTER_SIZES = {
  xs: 'w92',
  sm: 'w154',
  md: 'w185',
  lg: 'w342',
  xl: 'w500',
  xxl: 'w780',
  original: 'original',
} as const;

/** Backdrop sizes available from TMDB CDN. */
export const BACKDROP_SIZES = {
  sm: 'w300',
  md: 'w780',
  lg: 'w1280',
  original: 'original',
} as const;

/** Profile (actor/person) photo sizes. */
export const PROFILE_SIZES = {
  sm: 'w45',
  md: 'w185',
  lg: 'h632',
  original: 'original',
} as const;

/** Logo sizes for watch providers and networks. */
export const LOGO_SIZES = {
  sm: 'w45',
  md: 'w92',
  lg: 'w154',
  xl: 'w300',
  original: 'original',
} as const;

/**
 * Cache TTLs in seconds for different TMDB endpoints.
 * Trending data changes often, movie details rarely.
 */
export const CACHE_TTL = {
  search: 60 * 15, // 15 min — results change with new releases
  trending: 60 * 30, // 30 min — updates periodically
  discover: 60 * 60, // 1 hour
  movieDetails: 60 * 60 * 24, // 24 hours — rarely changes
  tvDetails: 60 * 60 * 12, // 12 hours — ongoing shows update more
  genres: 60 * 60 * 24 * 7, // 7 days — almost never changes
} as const;

/**
 * Maps our app locales to TMDB language codes.
 * TMDB uses ISO 639-1 with optional country code.
 */
export const LOCALE_TO_TMDB_LANG: Record<string, string> = {
  en: 'en-US',
  pt: 'pt-PT',
  es: 'es-ES',
  fr: 'fr-FR',
};
