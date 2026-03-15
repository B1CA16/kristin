import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database';
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
  /** Cache TTL in seconds. Pass 0 to skip caching. */
  cacheTtl?: number;
  /** Additional query parameters. */
  params?: Record<string, string | number | undefined>;
};

/**
 * Low-level TMDB API fetch with:
 * - API key injection
 * - Locale mapping
 * - DB-level caching via media_cache table
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

  // Build a cache key from the URL (without API key for safety)
  const cacheKey = buildCacheKey(endpoint, locale, params);

  // Check DB cache first
  if (cacheTtl > 0) {
    const cached = await getCachedResponse<T>(cacheKey);
    if (cached) return cached;
  }

  // Fetch from TMDB with retry on rate limit
  const data = await fetchWithRetry<T>(url.toString());

  // Write to cache in the background (don't block the response)
  if (cacheTtl > 0) {
    setCachedResponse(cacheKey, data, cacheTtl).catch(() => {
      // Cache write failures are non-critical — log but don't throw
    });
  }

  return data;
}

/**
 * Fetch with exponential backoff on 429 responses.
 * Max 3 retries with 1s, 2s, 4s delays.
 */
async function fetchWithRetry<T>(url: string, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url);

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
// DB cache (media_cache table)
// ---------------------------------------------------------------------------

function buildCacheKey(
  endpoint: string,
  locale: string,
  params: Record<string, string | number | undefined>,
): string {
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  return `tmdb:${locale}:${endpoint}${sortedParams ? `?${sortedParams}` : ''}`;
}

async function getCachedResponse<T>(cacheKey: string): Promise<T | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('media_cache')
    .select('data, expires_at')
    .eq('cache_key', cacheKey)
    .single();

  if (!data) return null;

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    // Expired — delete in background, return null
    supabase.from('media_cache').delete().eq('cache_key', cacheKey).then();
    return null;
  }

  return data.data as T;
}

async function setCachedResponse(
  cacheKey: string,
  data: unknown,
  ttlSeconds: number,
): Promise<void> {
  const supabase = createAdminClient();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  await supabase.from('media_cache').upsert(
    {
      cache_key: cacheKey,
      data: data as Json,
      expires_at: expiresAt,
    },
    { onConflict: 'cache_key' },
  );
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
    voteAverageGte?: number;
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
      'vote_average.gte': options.voteAverageGte,
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
    voteAverageGte?: number;
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
      'vote_average.gte': options.voteAverageGte,
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
): Promise<{ title: string; posterPath: string | null }> {
  if (mediaType === 'movie') {
    const data = await tmdbFetch<{ title: string; poster_path: string | null }>(
      `/movie/${id}`,
      { locale: options.locale, cacheTtl: CACHE_TTL.movieDetails },
    );
    return { title: data.title, posterPath: data.poster_path };
  }
  const data = await tmdbFetch<{ name: string; poster_path: string | null }>(
    `/tv/${id}`,
    { locale: options.locale, cacheTtl: CACHE_TTL.tvDetails },
  );
  return { title: data.name, posterPath: data.poster_path };
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
