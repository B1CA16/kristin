import { NextRequest, NextResponse } from 'next/server';
import { discoverMovies, discoverTV } from '@/lib/tmdb';
import { logger } from '@/lib/logger';

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
  let sortBy = searchParams.get('sortBy') || undefined;
  const withGenres = searchParams.get('withGenres') || undefined;
  const year = searchParams.get('year')
    ? parseInt(searchParams.get('year')!, 10)
    : undefined;
  const voteAverageGte = searchParams.get('voteAverageGte')
    ? parseFloat(searchParams.get('voteAverageGte')!)
    : undefined;

  // Normalize sort field for the media type — TMDB uses different date fields
  // for movies (primary_release_date) and TV (first_air_date)
  if (type === 'tv' && sortBy?.includes('primary_release_date')) {
    sortBy = sortBy.replace('primary_release_date', 'first_air_date');
  } else if (type === 'movie' && sortBy?.includes('first_air_date')) {
    sortBy = sortBy.replace('first_air_date', 'primary_release_date');
  }

  // Cap date-sorted results to today to exclude unreleased titles
  const isDateSort =
    sortBy?.includes('release_date') || sortBy?.includes('air_date');
  const today = new Date().toISOString().split('T')[0];

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
            firstAirDateLte: isDateSort ? today : undefined,
            voteAverageGte,
            voteCountGte,
          })
        : await discoverMovies({
            locale,
            page,
            sortBy,
            withGenres,
            year,
            releaseDateLte: isDateSort ? today : undefined,
            voteAverageGte,
            voteCountGte,
          });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    logger.error('TMDB discover failed', {
      type,
      sortBy,
      withGenres,
      error: String(error),
    });
    return NextResponse.json(
      { error: 'Failed to fetch discover results' },
      { status: 502 },
    );
  }
}
