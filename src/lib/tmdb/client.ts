import 'server-only';

import { TMDB_API_BASE, LOCALE_TO_TMDB_LANG, CACHE_TTL } from './config';
import type {
  PaginatedResponse,
  MovieListResult,
  TVListResult,
  MovieDetails,
  TVDetails,
  MultiSearchResult,
  GenreListResponse,
} from './types';

// ---------------------------------------------------------------------------
// Core fetch with retry
// ---------------------------------------------------------------------------

type TMDBFetchOptions = {
  /** App locale (en, pt, es, fr). Mapped to TMDB language code. */
  locale?: string;
  /** Cache TTL in seconds. Used for Next.js fetch cache (revalidate). */
  cacheTtl?: number;
  /** Additional query parameters. */
  params?: Record<string, string | number | undefined>;
};

/**
 * Low-level TMDB API fetch with:
 * - API key injection
 * - Locale mapping
 * - Next.js fetch cache (replaced a Supabase-backed cache to eliminate egress)
 * - Exponential backoff on 429 (rate limit)
 */
async function tmdbFetch<T>(
  endpoint: string,
  options: TMDBFetchOptions = {},
): Promise<T> {
  const { locale = 'en', cacheTtl = 0, params = {} } = options;

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY environment variable is not set');
  }

  // Build the full URL with query params
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', LOCALE_TO_TMDB_LANG[locale] || 'en-US');

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  // Fetch from TMDB with retry on rate limit.
  // Next.js fetch cache handles caching at the edge — no Supabase round-trip.
  const data = await fetchWithRetry<T>(url.toString(), 3, cacheTtl);

  return data;
}

/**
 * Fetch with exponential backoff on 429 responses.
 * Uses Next.js fetch cache for automatic edge caching on Vercel.
 */
async function fetchWithRetry<T>(
  url: string,
  maxRetries = 3,
  revalidate = 0,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      next: revalidate > 0 ? { revalidate } : undefined,
    });

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    // Rate limited — retry with exponential backoff
    if (response.status === 429 && attempt < maxRetries) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText} for ${url}`,
    );
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('TMDB API: max retries exceeded');
}

// ---------------------------------------------------------------------------
// Public API methods
// ---------------------------------------------------------------------------

/** Search movies, TV shows, and people. */
export async function searchMulti(
  query: string,
  options: { locale?: string; page?: number } = {},
) {
  return tmdbFetch<PaginatedResponse<MultiSearchResult>>('/search/multi', {
    locale: options.locale,
    cacheTtl: CACHE_TTL.search,
    params: { query, page: options.page },
  });
}

/** Search movies only. */
export async function searchMovies(
  query: string,
  options: { locale?: string; page?: number } = {},
) {
  return tmdbFetch<PaginatedResponse<MovieListResult>>('/search/movie', {
    locale: options.locale,
    cacheTtl: CACHE_TTL.search,
    params: { query, page: options.page },
  });
}

/** Search TV shows only. */
export async function searchTV(
  query: string,
  options: { locale?: string; page?: number } = {},
) {
  return tmdbFetch<PaginatedResponse<TVListResult>>('/search/tv', {
    locale: options.locale,
    cacheTtl: CACHE_TTL.search,
    params: { query, page: options.page },
  });
}

/** Get trending movies and TV shows. */
export async function getTrending(
  mediaType: 'movie' | 'tv' | 'all' = 'all',
  timeWindow: 'day' | 'week' = 'day',
  options: { locale?: string; page?: number } = {},
) {
  return tmdbFetch<PaginatedResponse<MovieListResult | TVListResult>>(
    `/trending/${mediaType}/${timeWindow}`,
    {
      locale: options.locale,
      cacheTtl: CACHE_TTL.trending,
      params: { page: options.page },
    },
  );
}

/** Discover movies with filters. */
export async function discoverMovies(
  options: {
    locale?: string;
    page?: number;
    sortBy?: string;
    withGenres?: string;
    year?: number;
    releaseDateLte?: string;
    voteAverageGte?: number;
    voteCountGte?: number;
  } = {},
) {
  return tmdbFetch<PaginatedResponse<MovieListResult>>('/discover/movie', {
    locale: options.locale,
    cacheTtl: CACHE_TTL.discover,
    params: {
      page: options.page,
      sort_by: options.sortBy || 'popularity.desc',
      with_genres: options.withGenres,
      primary_release_year: options.year,
      'primary_release_date.lte': options.releaseDateLte,
      'vote_average.gte': options.voteAverageGte,
      'vote_count.gte': options.voteCountGte,
    },
  });
}

/** Discover TV shows with filters. */
export async function discoverTV(
  options: {
    locale?: string;
    page?: number;
    sortBy?: string;
    withGenres?: string;
    firstAirDateYear?: number;
    firstAirDateLte?: string;
    voteAverageGte?: number;
    voteCountGte?: number;
  } = {},
) {
  return tmdbFetch<PaginatedResponse<TVListResult>>('/discover/tv', {
    locale: options.locale,
    cacheTtl: CACHE_TTL.discover,
    params: {
      page: options.page,
      sort_by: options.sortBy || 'popularity.desc',
      with_genres: options.withGenres,
      first_air_date_year: options.firstAirDateYear,
      'first_air_date.lte': options.firstAirDateLte,
      'vote_average.gte': options.voteAverageGte,
      'vote_count.gte': options.voteCountGte,
    },
  });
}

/**
 * Fetch basic info (title + poster) for a media item.
 * Used to hydrate community suggestion targets without the full details payload.
 */
export async function getMediaBasicInfo(
  id: number,
  mediaType: 'movie' | 'tv',
  options: { locale?: string } = {},
): Promise<{
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
}> {
  if (mediaType === 'movie') {
    const data = await tmdbFetch<{
      title: string;
      poster_path: string | null;
      release_date?: string;
      vote_average?: number;
    }>(`/movie/${id}`, {
      locale: options.locale,
      cacheTtl: CACHE_TTL.movieDetails,
    });
    return {
      title: data.title,
      posterPath: data.poster_path,
      releaseDate: data.release_date ?? null,
      voteAverage: data.vote_average ?? null,
    };
  }
  const data = await tmdbFetch<{
    name: string;
    poster_path: string | null;
    first_air_date?: string;
    vote_average?: number;
  }>(`/tv/${id}`, {
    locale: options.locale,
    cacheTtl: CACHE_TTL.tvDetails,
  });
  return {
    title: data.name,
    posterPath: data.poster_path,
    releaseDate: data.first_air_date ?? null,
    voteAverage: data.vote_average ?? null,
  };
}

/** Get full movie details with credits, videos, recommendations, and providers. */
export async function getMovieDetails(
  id: number,
  options: { locale?: string } = {},
) {
  return tmdbFetch<MovieDetails>(`/movie/${id}`, {
    locale: options.locale,
    cacheTtl: CACHE_TTL.movieDetails,
    params: {
      append_to_response:
        'credits,videos,recommendations,similar,watch/providers',
    },
  });
}

/** Get full TV show details with credits, videos, recommendations, and providers. */
export async function getTVDetails(
  id: number,
  options: { locale?: string } = {},
) {
  return tmdbFetch<TVDetails>(`/tv/${id}`, {
    locale: options.locale,
    cacheTtl: CACHE_TTL.tvDetails,
    params: {
      append_to_response:
        'credits,videos,recommendations,similar,watch/providers',
    },
  });
}

/** Get the list of movie genres. */
export async function getMovieGenres(options: { locale?: string } = {}) {
  return tmdbFetch<GenreListResponse>('/genre/movie/list', {
    locale: options.locale,
    cacheTtl: CACHE_TTL.genres,
  });
}

/** Get the list of TV genres. */
export async function getTVGenres(options: { locale?: string } = {}) {
  return tmdbFetch<GenreListResponse>('/genre/tv/list', {
    locale: options.locale,
    cacheTtl: CACHE_TTL.genres,
  });
}
