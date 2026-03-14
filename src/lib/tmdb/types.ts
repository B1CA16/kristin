/**
 * TMDB API response types.
 *
 * Only the fields we actually use are typed — TMDB returns much more,
 * but typing unused fields creates maintenance burden for no benefit.
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export type MediaType = 'movie' | 'tv' | 'person';

export type PaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type Genre = {
  id: number;
  name: string;
};

// ---------------------------------------------------------------------------
// Movie
// ---------------------------------------------------------------------------

/** Movie result from search, trending, discover endpoints. */
export type MovieListResult = {
  id: number;
  media_type?: 'movie';
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
};

/** Full movie details from /movie/{id} with append_to_response. */
export type MovieDetails = {
  id: number;
  title: string;
  original_title: string;
  tagline: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  genres: Genre[];
  status: string;
  budget: number;
  revenue: number;
  popularity: number;
  adult: boolean;
  imdb_id: string | null;
  credits?: Credits;
  videos?: VideoResponse;
  recommendations?: PaginatedResponse<MovieListResult>;
  similar?: PaginatedResponse<MovieListResult>;
  'watch/providers'?: WatchProviderResponse;
};

// ---------------------------------------------------------------------------
// TV
// ---------------------------------------------------------------------------

/** TV show result from search, trending, discover endpoints. */
export type TVListResult = {
  id: number;
  media_type?: 'tv';
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
};

/** Full TV show details from /tv/{id} with append_to_response. */
export type TVDetails = {
  id: number;
  name: string;
  original_name: string;
  tagline: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  vote_average: number;
  vote_count: number;
  genres: Genre[];
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  networks: { id: number; name: string; logo_path: string | null }[];
  seasons: Season[];
  popularity: number;
  imdb_id: string | null;
  credits?: Credits;
  videos?: VideoResponse;
  recommendations?: PaginatedResponse<TVListResult>;
  similar?: PaginatedResponse<TVListResult>;
  'watch/providers'?: WatchProviderResponse;
};

export type Season = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string | null;
};

// ---------------------------------------------------------------------------
// Person (multi-search only)
// ---------------------------------------------------------------------------

export type PersonListResult = {
  id: number;
  media_type?: 'person';
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
};

// ---------------------------------------------------------------------------
// Multi-search union
// ---------------------------------------------------------------------------

export type MultiSearchResult =
  | (MovieListResult & { media_type: 'movie' })
  | (TVListResult & { media_type: 'tv' })
  | (PersonListResult & { media_type: 'person' });

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type CrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
};

export type Credits = {
  cast: CastMember[];
  crew: CrewMember[];
};

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

export type Video = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
};

export type VideoResponse = {
  results: Video[];
};

// ---------------------------------------------------------------------------
// Watch Providers
// ---------------------------------------------------------------------------

export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
};

export type WatchProviderCountry = {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

export type WatchProviderResponse = {
  results: Record<string, WatchProviderCountry>;
};

// ---------------------------------------------------------------------------
// Genre list
// ---------------------------------------------------------------------------

export type GenreListResponse = {
  genres: Genre[];
};
