import { NextRequest, NextResponse } from 'next/server';
import { discoverMovies, discoverTV } from '@/lib/tmdb';

/**
 * GET /api/tmdb/discover
 *
 * Proxied TMDB discover for client components.
 * Accepts: type (movie|tv), page, locale, sortBy, withGenres, year, voteAverageGte
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') || 'movie';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const locale = searchParams.get('locale') || 'en';
  const sortBy = searchParams.get('sortBy') || undefined;
  const withGenres = searchParams.get('withGenres') || undefined;
  const year = searchParams.get('year')
    ? parseInt(searchParams.get('year')!, 10)
    : undefined;
  const voteAverageGte = searchParams.get('voteAverageGte')
    ? parseFloat(searchParams.get('voteAverageGte')!)
    : undefined;

  try {
    const data =
      type === 'tv'
        ? await discoverTV({
            locale,
            page,
            sortBy,
            withGenres,
            firstAirDateYear: year,
            voteAverageGte,
          })
        : await discoverMovies({
            locale,
            page,
            sortBy,
            withGenres,
            year,
            voteAverageGte,
          });

    return NextResponse.json(data);
  } catch (error) {
    console.error('TMDB discover error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discover results' },
      { status: 502 },
    );
  }
}
