import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { getMovieDetails, getMediaBasicInfo } from '@/lib/tmdb';
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

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();

  try {
    const movie = await getMovieDetails(parseInt(id, 10), { locale });
    const year = movie.release_date
      ? ` (${new Date(movie.release_date).getFullYear()})`
      : '';
    const posterImage = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : undefined;
    return {
      title: `${movie.title}${year}`,
      description: movie.overview || undefined,
      openGraph: {
        title: `${movie.title}${year}`,
        description: movie.overview || undefined,
        images: posterImage ? [posterImage] : undefined,
      },
    };
  } catch {
    return { title: 'Movie' };
  }
}

export default async function MoviePage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations('media');

  const movieId = parseInt(id, 10);
  if (isNaN(movieId)) notFound();

  let movie;
  try {
    movie = await getMovieDetails(movieId, { locale });
  } catch {
    notFound();
  }

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear().toString()
    : '';

  const hours = movie.runtime ? Math.floor(movie.runtime / 60) : 0;
  const minutes = movie.runtime ? movie.runtime % 60 : 0;
  const metaLine =
    movie.runtime && movie.runtime > 0 ? t('runtime', { hours, minutes }) : '';

  // Find director from crew
  const director = movie.credits?.crew?.find((c) => c.job === 'Director');

  const region = LOCALE_TO_REGION[locale] || 'US';
  const providers = movie['watch/providers']?.results?.[region];

  const recommendations = movie.recommendations?.results ?? [];
  const similar = movie.similar?.results ?? [];

  // Community suggestions
  const { data: suggestions } = await getSuggestionsForMedia({
    tmdbId: movieId,
    mediaType: 'movie',
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
    getListStatus({ tmdbId: movieId, mediaType: 'movie' }),
    getReviewsForMedia({ tmdbId: movieId, mediaType: 'movie' }),
    getUserReview({ tmdbId: movieId, mediaType: 'movie' }),
    getRatingDistribution({ tmdbId: movieId, mediaType: 'movie' }),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: movie.overview || undefined,
    datePublished: movie.release_date || undefined,
    image: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : undefined,
    aggregateRating:
      movie.vote_average > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: movie.vote_average,
            bestRating: 10,
            ratingCount: movie.vote_count,
          }
        : undefined,
    genre: movie.genres?.map((g) => g.name),
    director: director ? { '@type': 'Person', name: director.name } : undefined,
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MediaHero
        title={movie.title}
        tagline={movie.tagline}
        overview={movie.overview}
        posterPath={movie.poster_path}
        backdropPath={movie.backdrop_path}
        genres={movie.genres}
        mediaType="movie"
        yearDisplay={year}
        metaLine={metaLine}
        voteAverage={movie.vote_average}
        videos={movie.videos?.results}
        creditLabel={director ? t('director') : undefined}
        creditName={director?.name}
        actions={
          <MediaActions
            tmdbId={movieId}
            mediaType="movie"
            initialStatus={listStatus}
            isLoggedIn={isLoggedIn}
          />
        }
      />

      <div className="relative overflow-hidden">
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
                    sourceTmdbId={movieId}
                    sourceMediaType="movie"
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
                          mediaType="movie"
                          title={rec.title}
                          posterPath={rec.poster_path}
                          releaseDate={rec.release_date}
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
                          mediaType="movie"
                          title={sim.title}
                          posterPath={sim.poster_path}
                          releaseDate={sim.release_date}
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
                  tmdbId={movieId}
                  mediaType="movie"
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
              {movie.credits?.cast && (
                <CastCarousel cast={movie.credits.cast} />
              )}
              <WatchProviders providers={providers} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
