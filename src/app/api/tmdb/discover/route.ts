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

  // When sorting by rating, require a minimum vote count to filter out
  // obscure titles with inflated averages from very few votes.
  const isRatingSort = sortBy?.startsWith('vote_average');
  const voteCountGte = searchParams.get('voteCountGte')
    ? parseInt(searchParams.get('voteCountGte')!, 10)
    : isRatingSort
      ? 200
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
            voteCountGte,
          })
        : await discoverMovies({
            locale,
            page,
            sortBy,
            withGenres,
            year,
            voteAverageGte,
            voteCountGte,
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
