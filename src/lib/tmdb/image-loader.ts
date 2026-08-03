/**
 * Custom `next/image` loader for TMDB artwork.
 *
 * TMDB already serves pre-resized variants of every image from its own CDN
 * (`/t/p/w342/…`, `/t/p/w780/…`, and so on). Running those through Vercel's
 * Image Optimization means spending transformation quota to re-encode files that
 * are already the right size and already on a CDN — and the Hobby plan only
 * includes 5,000 transformations per month, which a poster grid burns through in
 * days. Exceeding it makes new images return HTTP 402, so posters silently
 * degrade to alt text.
 *
 * This loader maps the width `next/image` asks for onto the nearest TMDB size
 * bucket, so responsive `srcset` still works, lazy loading and layout stability
 * are unchanged, and the resizing happens on TMDB's CDN for free.
 *
 * The URL builders in `./image.ts` tag each URL with `?k=<kind>` because the
 * valid bucket list differs per image type and the file path alone doesn't say
 * which type it is. The tag is stripped before the URL is returned.
 *
 * Anything this loader doesn't recognise — local `/public` assets, Supabase
 * avatars, or an untagged TMDB URL — is passed through untouched. Note that
 * `loaderFile` is global, so those images are served as-is rather than
 * optimized; that is the accepted trade-off for eliminating the quota problem.
 */

/** Width buckets TMDB actually serves, per image kind. Must stay sorted. */
const BUCKETS = {
  poster: [92, 154, 185, 342, 500, 780],
  backdrop: [300, 780, 1280],
  profile: [45, 185],
  logo: [45, 92, 154, 185, 300, 500],
} as const;

export type TmdbImageKind = keyof typeof BUCKETS;

/** Query parameter carrying the image kind from the URL builders to this loader. */
export const IMAGE_KIND_PARAM = 'k';

function isImageKind(value: string | null): value is TmdbImageKind {
  return value !== null && value in BUCKETS;
}

/** Smallest bucket that covers `width`, or the largest available if none does. */
function nearestBucket(kind: TmdbImageKind, width: number): number {
  const buckets = BUCKETS[kind];
  return (
    buckets.find((bucket) => bucket >= width) ?? buckets[buckets.length - 1]
  );
}

interface LoaderArgs {
  src: string;
  width: number;
}

/**
 * Next.js requires `loaderFile` to expose a default export, which is why this
 * file breaks the project's named-export convention.
 */
export default function tmdbImageLoader({ src, width }: LoaderArgs): string {
  // Only tagged absolute URLs are candidates. Relative sources (local assets)
  // and anything without a query string pass straight through.
  const queryStart = src.indexOf('?');
  if (queryStart === -1) return src;

  const kind = new URLSearchParams(src.slice(queryStart)).get(IMAGE_KIND_PARAM);
  const bare = src.slice(0, queryStart);

  if (!isImageKind(kind)) return bare;

  // Rewrite the size segment in `/t/p/<size>/<file>`. If the existing segment
  // isn't a width bucket — `original` or the `h632` profile size — the component
  // asked for it explicitly, so honour that rather than second-guessing it.
  return bare.replace(
    /(\/t\/p\/)(w\d+)(\/)/,
    (_match, prefix: string, _size: string, suffix: string) =>
      `${prefix}w${nearestBucket(kind, width)}${suffix}`,
  );
}
