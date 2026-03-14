import { NextRequest, NextResponse } from 'next/server';
import { searchMulti, searchMovies, searchTV } from '@/lib/tmdb';

/**
 * GET /api/tmdb/search
 *
 * Proxied TMDB search for client components (e.g., search autocomplete).
 * Accepts: query, page, type (all|movie|tv), locale
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const type = searchParams.get('type') || 'all';
  const locale = searchParams.get('locale') || 'en';

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 },
    );
  }

  try {
    let data;
    switch (type) {
      case 'movie':
        data = await searchMovies(query, { locale, page });
        break;
      case 'tv':
        data = await searchTV(query, { locale, page });
        break;
      default:
        data = await searchMulti(query, { locale, page });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('TMDB search error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 502 },
    );
  }
}
