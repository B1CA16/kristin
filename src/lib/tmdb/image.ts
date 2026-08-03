import {
  TMDB_IMAGE_BASE,
  POSTER_SIZES,
  BACKDROP_SIZES,
  PROFILE_SIZES,
  LOGO_SIZES,
} from './config';
import { IMAGE_KIND_PARAM, type TmdbImageKind } from './image-loader';

type PosterSize = keyof typeof POSTER_SIZES;
type BackdropSize = keyof typeof BACKDROP_SIZES;
type ProfileSize = keyof typeof PROFILE_SIZES;
type LogoSize = keyof typeof LOGO_SIZES;

/**
 * Tag a TMDB URL with its image kind.
 *
 * The custom `next/image` loader needs to know which size buckets TMDB serves
 * for this image, and the file path alone doesn't say. The loader strips the tag
 * before requesting the image; anything else consuming these URLs (OG tags,
 * plain `<img>`) gets an unknown query parameter that TMDB ignores.
 *
 * The size passed here still matters: it's what non-`next/image` consumers get,
 * and it's the floor the loader upgrades from.
 */
function tag(url: string, kind: TmdbImageKind): string {
  return `${url}?${IMAGE_KIND_PARAM}=${kind}`;
}

/**
 * Build a full poster image URL.
 * Returns null if the path is null (movie has no poster).
 */
export function posterUrl(
  path: string | null,
  size: PosterSize = 'lg',
): string | null {
  if (!path) return null;
  return tag(`${TMDB_IMAGE_BASE}/${POSTER_SIZES[size]}${path}`, 'poster');
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
  return tag(`${TMDB_IMAGE_BASE}/${BACKDROP_SIZES[size]}${path}`, 'backdrop');
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
  return tag(`${TMDB_IMAGE_BASE}/${PROFILE_SIZES[size]}${path}`, 'profile');
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
  return tag(`${TMDB_IMAGE_BASE}/${LOGO_SIZES[size]}${path}`, 'logo');
}
