import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { getMovieGenres, getTVGenres } from '@/lib/tmdb';
import { SearchResults } from '@/components/search/search-results';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('search');
  return { title: t('title') };
}

type Props = {
  searchParams: Promise<{ q?: string; type?: string; withGenres?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q, type, withGenres } = await searchParams;
  const locale = await getLocale();

  const [movieGenreData, tvGenreData] = await Promise.all([
    getMovieGenres({ locale }),
    getTVGenres({ locale }),
  ]);

  return (
    <SearchResults
      initialQuery={q ?? ''}
      initialType={type ?? 'all'}
      initialGenre={withGenres ?? ''}
      movieGenres={movieGenreData.genres ?? []}
      tvGenres={tvGenreData.genres ?? []}
    />
  );
}
