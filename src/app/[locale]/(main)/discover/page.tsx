import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  getTrendingOnKristin,
  getPopularRecommendations,
} from '@/actions/discover';
import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
import { TMDBTrending } from '@/components/discover/tmdb-trending';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('discover');
  return { title: t('title') };
}

export default async function DiscoverPage() {
  const t = await getTranslations('discover');

  const [{ data: kristinTrending }, { data: popularRecs }] = await Promise.all([
    getTrendingOnKristin(),
    getPopularRecommendations(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-10 text-3xl font-bold">{t('title')}</h1>

      <div className="space-y-14">
        {/* Trending on Kristin */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            {t('trendingOnKristin')}
          </h2>
          {kristinTrending.length > 0 ? (
            <MediaGrid>
              {kristinTrending.map((item) => (
                <MediaCard
                  key={`${item.mediaType}-${item.tmdbId}`}
                  id={item.tmdbId}
                  mediaType={item.mediaType}
                  title={item.title}
                  posterPath={item.posterPath}
                  releaseDate={item.releaseDate ?? undefined}
                  voteAverage={item.voteAverage ?? undefined}
                />
              ))}
            </MediaGrid>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t('trendingOnKristinEmpty')}
            </p>
          )}
        </section>

        {/* Trending on TMDB */}
        <TMDBTrending />

        {/* Popular Recommendations */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            {t('popularRecommendations')}
          </h2>
          {popularRecs.length > 0 ? (
            <MediaGrid>
              {popularRecs.map((item) => (
                <MediaCard
                  key={`${item.targetType}-${item.targetTmdbId}`}
                  id={item.targetTmdbId}
                  mediaType={item.targetType}
                  title={item.title}
                  posterPath={item.posterPath}
                  releaseDate={item.releaseDate ?? undefined}
                  voteAverage={item.voteAverage ?? undefined}
                />
              ))}
            </MediaGrid>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t('popularRecommendationsEmpty')}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
