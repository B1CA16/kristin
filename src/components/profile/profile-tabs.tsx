'use client';

import { useCallback, useState, useTransition } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { posterUrl } from '@/lib/tmdb/image';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/reviews/star-rating';
import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
import {
  getProfileReviews,
  getProfileSuggestions,
  getProfileFavorites,
} from '@/actions/profile';
import type {
  ProfileReview,
  ProfileSuggestion,
  ProfileFavorite,
} from '@/actions/profile';

type Tab = 'reviews' | 'suggestions' | 'favorites';

type ProfileTabsProps = {
  userId: string;
  initialReviews: ProfileReview[];
  initialReviewsHasMore: boolean;
  initialSuggestions: ProfileSuggestion[];
  initialSuggestionsHasMore: boolean;
  showFavorites: boolean;
  initialFavorites: ProfileFavorite[];
  initialFavoritesHasMore: boolean;
};

export function ProfileTabs({
  userId,
  initialReviews,
  initialReviewsHasMore,
  initialSuggestions,
  initialSuggestionsHasMore,
  showFavorites,
  initialFavorites,
  initialFavoritesHasMore,
}: ProfileTabsProps) {
  const t = useTranslations('profile');
  const [activeTab, setActiveTab] = useState<Tab>('reviews');
  const [isPending, startTransition] = useTransition();

  // Reviews state
  const [reviews, setReviews] = useState(initialReviews);
  const [reviewsHasMore, setReviewsHasMore] = useState(initialReviewsHasMore);

  // Suggestions state
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [suggestionsHasMore, setSuggestionsHasMore] = useState(
    initialSuggestionsHasMore,
  );

  // Favorites state
  const [favorites, setFavorites] = useState(initialFavorites);
  const [favoritesHasMore, setFavoritesHasMore] = useState(
    initialFavoritesHasMore,
  );

  const loadMoreReviews = useCallback(() => {
    startTransition(async () => {
      const result = await getProfileReviews(userId, {
        offset: reviews.length,
      });
      if (!result.error) {
        setReviews((prev) => [...prev, ...result.data]);
        setReviewsHasMore(result.hasMore);
      }
    });
  }, [userId, reviews.length]);

  const loadMoreSuggestions = useCallback(() => {
    startTransition(async () => {
      const result = await getProfileSuggestions(userId, {
        offset: suggestions.length,
      });
      if (!result.error) {
        setSuggestions((prev) => [...prev, ...result.data]);
        setSuggestionsHasMore(result.hasMore);
      }
    });
  }, [userId, suggestions.length]);

  const loadMoreFavorites = useCallback(() => {
    startTransition(async () => {
      const result = await getProfileFavorites(userId, {
        offset: favorites.length,
      });
      if (!result.error) {
        setFavorites((prev) => [...prev, ...result.data]);
        setFavoritesHasMore(result.hasMore);
      }
    });
  }, [userId, favorites.length]);

  const tabs: { value: Tab; label: string; show: boolean }[] = [
    { value: 'reviews', label: t('reviews'), show: true },
    { value: 'suggestions', label: t('suggestions'), show: true },
    { value: 'favorites', label: t('favorites'), show: true },
  ];

  return (
    <div>
      {/* Tab buttons */}
      <div className="border-border mb-6 flex gap-1 border-b">
        {tabs
          .filter((tab) => tab.show)
          .map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={cn(
                'cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                activeTab === value
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              {label}
            </button>
          ))}
      </div>

      {/* Tab content */}
      {activeTab === 'reviews' && (
        <ReviewsTab
          reviews={reviews}
          hasMore={reviewsHasMore}
          isPending={isPending}
          onLoadMore={loadMoreReviews}
        />
      )}

      {activeTab === 'suggestions' && (
        <SuggestionsTab
          suggestions={suggestions}
          hasMore={suggestionsHasMore}
          isPending={isPending}
          onLoadMore={loadMoreSuggestions}
        />
      )}

      {activeTab === 'favorites' &&
        (showFavorites ? (
          <FavoritesTab
            favorites={favorites}
            hasMore={favoritesHasMore}
            isPending={isPending}
            onLoadMore={loadMoreFavorites}
          />
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {t('favoritesPrivate')}
          </p>
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content components
// ---------------------------------------------------------------------------

function ReviewsTab({
  reviews,
  hasMore,
  isPending,
  onLoadMore,
}: {
  reviews: ProfileReview[];
  hasMore: boolean;
  isPending: boolean;
  onLoadMore: () => void;
}) {
  const t = useTranslations('profile');

  if (reviews.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t('noReviews')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ProfileReviewCard key={review.id} review={review} />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isPending}
          >
            {isPending ? t('loading') : t('loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
}

function SuggestionsTab({
  suggestions,
  hasMore,
  isPending,
  onLoadMore,
}: {
  suggestions: ProfileSuggestion[];
  hasMore: boolean;
  isPending: boolean;
  onLoadMore: () => void;
}) {
  const t = useTranslations('profile');

  if (suggestions.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t('noSuggestions')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <ProfileSuggestionCard key={suggestion.id} suggestion={suggestion} />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isPending}
          >
            {isPending ? t('loading') : t('loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
}

function FavoritesTab({
  favorites,
  hasMore,
  isPending,
  onLoadMore,
}: {
  favorites: ProfileFavorite[];
  hasMore: boolean;
  isPending: boolean;
  onLoadMore: () => void;
}) {
  const t = useTranslations('profile');

  if (favorites.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t('noFavorites')}
      </p>
    );
  }

  return (
    <>
      <MediaGrid>
        {favorites.map((item) => (
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
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isPending}
          >
            {isPending ? t('loading') : t('loadMore')}
          </Button>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Profile-specific cards
// ---------------------------------------------------------------------------

function ProfileReviewCard({ review }: { review: ProfileReview }) {
  const poster = posterUrl(review.mediaPosterPath, 'xs');
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
  });

  return (
    <Link
      href={`/${review.mediaType}/${review.tmdbId}`}
      className="bg-card ring-border hover:ring-primary/40 flex gap-3 rounded-lg p-3 ring-1 transition-colors"
    >
      {/* Poster */}
      <div className="bg-muted relative h-[72px] w-12 shrink-0 overflow-hidden rounded">
        {poster ? (
          <Image
            src={poster}
            alt={review.mediaTitle}
            fill
            unoptimized
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-foreground text-[10px]">?</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate text-sm font-medium">{review.mediaTitle}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
        </div>
        {review.title && (
          <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
            {review.title}
          </p>
        )}
        <p className="text-muted-foreground mt-0.5 text-[11px]">{timeAgo}</p>
      </div>
    </Link>
  );
}

function ProfileSuggestionCard({
  suggestion,
}: {
  suggestion: ProfileSuggestion;
}) {
  const poster = posterUrl(suggestion.targetPosterPath, 'xs');

  return (
    <Link
      href={`/${suggestion.targetType}/${suggestion.targetTmdbId}`}
      className="bg-card ring-border hover:ring-primary/40 flex gap-3 rounded-lg p-3 ring-1 transition-colors"
    >
      {/* Poster */}
      <div className="bg-muted relative h-[72px] w-12 shrink-0 overflow-hidden rounded">
        {poster ? (
          <Image
            src={poster}
            alt={suggestion.targetTitle}
            fill
            unoptimized
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-foreground text-[10px]">?</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate text-sm font-medium">{suggestion.targetTitle}</p>
        {suggestion.reason && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
            {suggestion.reason}
          </p>
        )}
        <p className="text-muted-foreground mt-1 text-[11px]">
          {suggestion.voteCount} vote{suggestion.voteCount !== 1 ? 's' : ''}
        </p>
      </div>
    </Link>
  );
}
