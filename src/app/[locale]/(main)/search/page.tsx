import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SearchResults } from '@/components/search/search-results';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('search');
  return { title: t('title') };
}

type Props = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q, type } = await searchParams;

  return <SearchResults initialQuery={q ?? ''} initialType={type ?? 'all'} />;
}
