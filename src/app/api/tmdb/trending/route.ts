import { NextRequest, NextResponse } from 'next/server';
import { getTrending } from '@/lib/tmdb';

/**
 * GET /api/tmdb/trending
 *
 * Proxied TMDB trending for client components.
 * Accepts: mediaType (all|movie|tv), timeWindow (day|week), page, locale
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mediaType =
    (searchParams.get('mediaType') as 'movie' | 'tv' | 'all') || 'all';
  const timeWindow =
    (searchParams.get('timeWindow') as 'day' | 'week') || 'day';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const locale = searchParams.get('locale') || 'en';

  try {
    const data = await getTrending(mediaType, timeWindow, { locale, page });
    return NextResponse.json(data);
  } catch (error) {
    console.error('TMDB trending error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending results' },
      { status: 502 },
    );
  }
}
