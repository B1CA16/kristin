export {
  searchMulti,
  searchMovies,
  searchTV,
  getTrending,
  discoverMovies,
  discoverTV,
  getMovieDetails,
  getTVDetails,
  getMovieGenres,
  getTVGenres,
} from './client';

export { posterUrl, backdropUrl, profileUrl, logoUrl } from './image';

export {
  TMDB_IMAGE_BASE,
  POSTER_SIZES,
  BACKDROP_SIZES,
  PROFILE_SIZES,
  LOGO_SIZES,
  CACHE_TTL,
  LOCALE_TO_TMDB_LANG,
} from './config';

export type {
  MediaType,
  PaginatedResponse,
  Genre,
  MovieListResult,
  TVListResult,
  MovieDetails,
  TVDetails,
  Season,
  PersonListResult,
  MultiSearchResult,
  CastMember,
  CrewMember,
  Credits,
  Video,
  VideoResponse,
  WatchProvider,
  WatchProviderCountry,
  WatchProviderResponse,
  GenreListResponse,
} from './types';
