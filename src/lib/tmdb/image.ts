import {
  TMDB_IMAGE_BASE,
  POSTER_SIZES,
  BACKDROP_SIZES,
  PROFILE_SIZES,
  LOGO_SIZES,
} from './config';

type PosterSize = keyof typeof POSTER_SIZES;
type BackdropSize = keyof typeof BACKDROP_SIZES;
type ProfileSize = keyof typeof PROFILE_SIZES;
type LogoSize = keyof typeof LOGO_SIZES;

/**
 * Build a full poster image URL.
 * Returns null if the path is null (movie has no poster).
 */
export function posterUrl(
  path: string | null,
  size: PosterSize = 'lg',
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${POSTER_SIZES[size]}${path}`;
}

/**
 * Build a full backdrop image URL.
 * Returns null if the path is null.
 */
export function backdropUrl(
  path: string | null,
  size: BackdropSize = 'lg',
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${BACKDROP_SIZES[size]}${path}`;
}

/**
 * Build a full profile (person) image URL.
 * Returns null if the path is null.
 */
export function profileUrl(
  path: string | null,
  size: ProfileSize = 'md',
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${PROFILE_SIZES[size]}${path}`;
}

/**
 * Build a full logo image URL (providers, networks).
 * Returns null if the path is null.
 */
export function logoUrl(
  path: string | null,
  size: LogoSize = 'md',
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${LOGO_SIZES[size]}${path}`;
}
