import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { getTVDetails } from '@/lib/tmdb';
import { LOCALE_TO_REGION } from '@/lib/tmdb/config';
import { MediaHero } from '@/components/media/media-hero';
import { CastCarousel } from '@/components/media/cast-carousel';
import { WatchProviders } from '@/components/media/watch-providers';
import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();

  try {
    const show = await getTVDetails(parseInt(id, 10), { locale });
    const year = show.first_air_date
      ? ` (${new Date(show.first_air_date).getFullYear()})`
      : '';
    return {
      title: `${show.name}${year}`,
      description: show.overview || undefined,
    };
  } catch {
    return { title: 'TV Show' };
  }
}

export default async function TVPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations('media');

  const tvId = parseInt(id, 10);
  if (isNaN(tvId)) notFound();

  let show;
  try {
    show = await getTVDetails(tvId, { locale });
  } catch {
    notFound();
  }

  // Year display: "2020" or "2020–2024"
  const startYear = show.first_air_date
    ? new Date(show.first_air_date).getFullYear().toString()
    : '';
  const endYear = show.last_air_date
    ? new Date(show.last_air_date).getFullYear().toString()
    : '';
  const yearDisplay =
    startYear && endYear && startYear !== endYear
      ? `${startYear}–${endYear}`
      : startYear;

  // Meta line: seasons count
  const metaLine =
    show.number_of_seasons > 0
      ? t('seasons', { count: show.number_of_seasons })
      : '';

  // Find creator from crew
  const creator = show.credits?.crew?.find(
    (c) => c.job === 'Executive Producer' || c.department === 'Writing',
  );

  const region = LOCALE_TO_REGION[locale] || 'US';
  const providers = show['watch/providers']?.results?.[region];

  const recommendations = show.recommendations?.results ?? [];
  const similar = show.similar?.results ?? [];

  return (
    <div>
      <MediaHero
        title={show.name}
        tagline={show.tagline}
        overview={show.overview}
        posterPath={show.poster_path}
        backdropPath={show.backdrop_path}
        genres={show.genres}
        mediaType="tv"
        yearDisplay={yearDisplay}
        metaLine={metaLine}
        voteAverage={show.vote_average}
        videos={show.videos?.results}
        creditLabel={creator ? t('creator') : undefined}
        creditName={creator?.name}
      />

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Cast */}
        {show.credits?.cast && <CastCarousel cast={show.credits.cast} />}

        {/* Watch Providers */}
        <WatchProviders providers={providers} />

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              {t('recommendations')}
            </h2>
            <MediaGrid>
              {recommendations.slice(0, 12).map((rec) => (
                <MediaCard
                  key={rec.id}
                  id={rec.id}
                  mediaType="tv"
                  title={rec.name}
                  posterPath={rec.poster_path}
                  releaseDate={rec.first_air_date}
                  voteAverage={rec.vote_average}
                />
              ))}
            </MediaGrid>
          </section>
        )}

        {/* Similar */}
        {similar.length > 0 && recommendations.length === 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">{t('similar')}</h2>
            <MediaGrid>
              {similar.slice(0, 12).map((sim) => (
                <MediaCard
                  key={sim.id}
                  id={sim.id}
                  mediaType="tv"
                  title={sim.name}
                  posterPath={sim.poster_path}
                  releaseDate={sim.first_air_date}
                  voteAverage={sim.vote_average}
                />
              ))}
            </MediaGrid>
          </section>
        )}
      </div>
    </div>
  );
}
