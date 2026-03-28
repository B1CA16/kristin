import { track } from '@vercel/analytics';

/**
 * Typed analytics event tracking built on Vercel Web Analytics.
 *
 * All custom events appear in the Vercel dashboard under Events.
 * Page views are tracked automatically — these cover user interactions only.
 */

type AnalyticsEvents = {
  search: {
    query: string;
    filter: 'all' | 'movie' | 'tv';
    result_count: number;
  };
  suggestion_created: {
    source_media_type: 'movie' | 'tv';
    source_tmdb_id: number;
    target_media_type: 'movie' | 'tv';
    target_tmdb_id: number;
  };
  suggestion_voted: {
    suggestion_id: string;
    action: 'vote' | 'unvote';
  };
  review_submitted: {
    media_type: 'movie' | 'tv';
    tmdb_id: number;
    rating: number;
    is_edit: boolean;
  };
  list_toggled: {
    media_type: 'movie' | 'tv';
    tmdb_id: number;
    list_type: 'watchlist' | 'watched' | 'favorite';
    action: 'add' | 'remove';
  };
};

/**
 * Track a custom analytics event with type-safe properties.
 *
 * Events are only sent in production (Vercel Analytics ignores calls in dev).
 */
export function trackEvent<K extends keyof AnalyticsEvents>(
  event: K,
  properties: AnalyticsEvents[K],
) {
  track(event, properties);
}
