'use server';

import { createClient } from '@/lib/supabase/server';

type LogActivityParams = {
  userId: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  action: string;
};

/**
 * Log a user action for trending aggregation.
 * Fire-and-forget — errors are swallowed so logging never
 * breaks the primary user action.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('activity_log').insert({
      user_id: params.userId,
      tmdb_id: params.tmdbId,
      media_type: params.mediaType,
      action: params.action,
    });
  } catch {
    // Logging is best-effort — never block the user's action
  }
}
