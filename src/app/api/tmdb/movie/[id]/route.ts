import { NextRequest, NextResponse } from 'next/server';
import { getMovieDetails } from '@/lib/tmdb';
import { logger } from '@/lib/logger';

/**
 * GET /api/tmdb/movie/[id]
 *
 * Proxied TMDB movie details for client components.
 * Uses append_to_response to batch credits, videos, recommendations,
 * similar, and watch providers in a single request.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const movieId = parseInt(id, 10);

  if (isNaN(movieId)) {
    return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
  }

  const locale = request.nextUrl.searchParams.get('locale') || 'en';

  try {
    const data = await getMovieDetails(movieId, { locale });
    return NextResponse.json(data);
  } catch (error) {
    logger.error('TMDB movie details failed', {
      movieId,
      error: String(error),
    });
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 502 },
    );
  }
}
