import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { getTVDetails, getMediaBasicInfo } from '@/lib/tmdb';
import { LOCALE_TO_REGION } from '@/lib/tmdb/config';
import { getUser } from '@/lib/supabase/server';
import { getSuggestionsForMedia } from '@/actions/suggestions';
import { getListStatus } from '@/actions/lists';
import {
  getReviewsForMedia,
  getRatingDistribution,
  getUserReview,
} from '@/actions/reviews';
import { MediaHero } from '@/components/media/media-hero';
import { MediaActions } from '@/components/media/media-actions';
import { CastCarousel } from '@/components/media/cast-carousel';
import { WatchProviders } from '@/components/media/watch-providers';
import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
import { RecommendationTabs } from '@/components/recommendations/recommendation-tabs';
import { CommunitySuggestions } from '@/components/recommendations/community-suggestions';
import { ReviewList } from '@/components/reviews/review-list';
import { RatingDistribution } from '@/components/reviews/rating-distribution';
import { AdSlot } from '@/components/ads/ad-slot';

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
    const posterImage = show.poster_path
      ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
      : undefined;
    return {
      title: `${show.name}${year}`,
      description: show.overview || undefined,
      openGraph: {
        title: `${show.name}${year}`,
        description: show.overview || undefined,
        images: posterImage ? [posterImage] : undefined,
      },
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

  // Community suggestions
  const { data: suggestions } = await getSuggestionsForMedia({
    tmdbId: tvId,
    mediaType: 'tv',
  });

  // Fetch title/poster for each suggestion target
  const targetInfo: Record<
    string,
    { title: string; posterPath: string | null }
  > = {};
  await Promise.all(
    suggestions.map(async (s) => {
      const key = `${s.targetType}-${s.targetTmdbId}`;
      try {
        targetInfo[key] = await getMediaBasicInfo(
          s.targetTmdbId,
          s.targetType,
          { locale },
        );
      } catch {
        targetInfo[key] = { title: 'Unknown', posterPath: null };
      }
    }),
  );

  // Check if user is logged in + fetch list status
  const user = await getUser();
  const isLoggedIn = !!user;

  const [
    { data: listStatus },
    { data: reviews, total: reviewTotal, hasMore: reviewHasMore },
    { data: userReview },
    { data: allRatings },
  ] = await Promise.all([
    getListStatus({ tmdbId: tvId, mediaType: 'tv' }),
    getReviewsForMedia({ tmdbId: tvId, mediaType: 'tv' }),
    getUserReview({ tmdbId: tvId, mediaType: 'tv' }),
    getRatingDistribution({ tmdbId: tvId, mediaType: 'tv' }),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: show.name,
    description: show.overview || undefined,
    datePublished: show.first_air_date || undefined,
    image: show.poster_path
      ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
      : undefined,
    aggregateRating:
      show.vote_average > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: show.vote_average,
            bestRating: 10,
            ratingCount: show.vote_count,
          }
        : undefined,
    genre: show.genres?.map((g) => g.name),
    numberOfSeasons: show.number_of_seasons || undefined,
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
        actions={
          <MediaActions
            tmdbId={tvId}
            mediaType="tv"
            initialStatus={listStatus}
            isLoggedIn={isLoggedIn}
          />
        }
      />

      <div className="relative overflow-x-clip">
        <div className="blob bg-primary/10 absolute -top-20 right-0 size-96" />
        <div className="blob bg-primary/[0.07] absolute bottom-1/3 left-0 size-80" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12">
            {/* Primary column — recommendations + reviews */}
            <div className="space-y-12">
              <RecommendationTabs
                communityContent={
                  <CommunitySuggestions
                    suggestions={suggestions}
                    targetInfo={targetInfo}
                    sourceTmdbId={tvId}
                    sourceMediaType="tv"
                    isLoggedIn={isLoggedIn}
                    currentUserId={user?.id}
                  />
                }
                algorithmContent={
                  recommendations.length > 0 ? (
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
                  ) : similar.length > 0 ? (
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
                  ) : (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      {t('noRecommendations')}
                    </p>
                  )
                }
              />

              {/* Reviews section */}
              <div>
                <RatingDistribution ratings={allRatings} className="mb-6" />
                <ReviewList
                  tmdbId={tvId}
                  mediaType="tv"
                  initialReviews={reviews}
                  initialTotal={reviewTotal}
                  initialHasMore={reviewHasMore}
                  isLoggedIn={isLoggedIn}
                  currentUserId={user?.id}
                  existingReview={userReview}
                />
              </div>
            </div>

            {/* Sidebar — cast + providers */}
            <aside className="mt-12 space-y-10 lg:mt-0">
              {show.credits?.cast && <CastCarousel cast={show.credits.cast} />}
              <WatchProviders providers={providers} />
              <AdSlot format="sidebar" className="hidden lg:flex" />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
