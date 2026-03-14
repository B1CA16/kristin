import { NextRequest, NextResponse } from 'next/server';
import { getTVDetails } from '@/lib/tmdb';

/**
 * GET /api/tmdb/tv/[id]
 *
 * Proxied TMDB TV show details for client components.
 * Uses append_to_response to batch credits, videos, recommendations,
 * similar, and watch providers in a single request.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tvId = parseInt(id, 10);

  if (isNaN(tvId)) {
    return NextResponse.json({ error: 'Invalid TV show ID' }, { status: 400 });
  }

  const locale = request.nextUrl.searchParams.get('locale') || 'en';

  try {
    const data = await getTVDetails(tvId, { locale });
    return NextResponse.json(data);
  } catch (error) {
    console.error('TMDB TV details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TV show details' },
      { status: 502 },
    );
  }
}
