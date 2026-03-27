import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getUser } from '@/lib/supabase/server';
import {
  getPublicProfile,
  getProfileReviews,
  getProfileSuggestions,
  getProfileFavorites,
} from '@/actions/profile';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileStats } from '@/components/profile/profile-stats';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const { data: profile } = await getPublicProfile(username);

  if (!profile) {
    return { title: 'Profile' };
  }

  const displayName = profile.displayName || profile.username;
  return {
    title: displayName,
    description: profile.bio || `${displayName}'s profile on Kristin`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  const { data: profile } = await getPublicProfile(username);
  if (!profile) notFound();

  const user = await getUser();
  const isOwnProfile = user?.id === profile.id;

  // Determine if favorites should be visible
  const showFavorites = isOwnProfile || profile.publicFavorites;

  // Fetch initial activity data in parallel
  const [
    { data: reviews, hasMore: reviewsHasMore },
    { data: suggestions, hasMore: suggestionsHasMore },
    favoritesResult,
  ] = await Promise.all([
    getProfileReviews(profile.id),
    getProfileSuggestions(profile.id),
    showFavorites
      ? getProfileFavorites(profile.id)
      : Promise.resolve({
          data: [] as Awaited<ReturnType<typeof getProfileFavorites>>['data'],
          hasMore: false,
          error: null,
        }),
  ]);

  return (
    <div className="relative overflow-hidden">
      <div className="blob bg-primary/[0.07] absolute -top-16 left-0 size-72" />
      <div className="blob bg-primary/[0.05] absolute right-0 bottom-1/3 size-64" />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-8">
          <ProfileHeader
            profile={profile}
            isOwnProfile={isOwnProfile}
            editButton={
              isOwnProfile ? <EditProfileDialog profile={profile} /> : undefined
            }
          />

          <ProfileStats
            reviewCount={profile.stats.reviewCount}
            suggestionCount={profile.stats.suggestionCount}
            totalVotesReceived={profile.stats.totalVotesReceived}
          />

          <ProfileTabs
            userId={profile.id}
            initialReviews={reviews}
            initialReviewsHasMore={reviewsHasMore}
            initialSuggestions={suggestions}
            initialSuggestionsHasMore={suggestionsHasMore}
            showFavorites={showFavorites}
            initialFavorites={favoritesResult.data}
            initialFavoritesHasMore={favoritesResult.hasMore}
          />
        </div>
      </div>
    </div>
  );
}
