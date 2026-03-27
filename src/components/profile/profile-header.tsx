import { useTranslations } from 'next-intl';
import { format } from 'date-fns';

import { ReputationBadge } from '@/components/profile/reputation-badge';
import type { PublicProfile } from '@/actions/profile';

type ProfileHeaderProps = {
  profile: PublicProfile;
  isOwnProfile: boolean;
  editButton?: React.ReactNode;
};

/**
 * Profile header with avatar, name, bio, reputation badge, and join date.
 */
export function ProfileHeader({
  profile,
  isOwnProfile,
  editButton,
}: ProfileHeaderProps) {
  const t = useTranslations('profile');

  const joinDate = format(new Date(profile.createdAt), 'MMM yyyy');
  const displayName = profile.displayName || profile.username;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      {/* Avatar with purple ring */}
      <div className="bg-primary shrink-0 rounded-full p-[3px]">
        <div className="bg-card text-primary flex size-20 items-center justify-center rounded-full text-2xl font-bold uppercase sm:size-24">
          {displayName.charAt(0)}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <h1 className="font-display text-2xl font-bold">{displayName}</h1>
          <ReputationBadge reputation={profile.reputation} size="md" />
        </div>

        {profile.displayName && (
          <p className="text-muted-foreground text-sm">@{profile.username}</p>
        )}

        {profile.bio && (
          <p className="mt-2 max-w-lg text-sm leading-relaxed">{profile.bio}</p>
        )}

        <p className="text-muted-foreground mt-2 text-xs">
          {t('memberSince', { date: joinDate })}
        </p>

        {isOwnProfile && editButton && <div className="mt-3">{editButton}</div>}
      </div>
    </div>
  );
}
