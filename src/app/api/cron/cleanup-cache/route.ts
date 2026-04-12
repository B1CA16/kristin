import { NextResponse } from 'next/server';

/**
 * POST /api/cron/cleanup-cache
 *
 * Previously cleaned up expired media_cache rows in Supabase.
 * Disabled — TMDB caching now uses Next.js fetch cache (edge, no DB).
 * The media_cache table can be dropped once confirmed stable.
 */
export async function POST() {
  return NextResponse.json({
    status: 'ok',
    message: 'Cache cleanup disabled — using Next.js fetch cache',
    timestamp: new Date().toISOString(),
  });
}
