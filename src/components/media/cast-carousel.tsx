import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { profileUrl } from '@/lib/tmdb/image';
import type { CastMember } from '@/lib/tmdb/types';

type CastCarouselProps = {
  cast: CastMember[];
  /** Max number of cast members to show. Defaults to 20. */
  limit?: number;
};

/**
 * Horizontal scrollable cast list with profile photos.
 * Shows actor name and character name below each photo.
 */
export function CastCarousel({ cast, limit = 20 }: CastCarouselProps) {
  const t = useTranslations('media');
  const visibleCast = cast.slice(0, limit);

  if (visibleCast.length === 0) return null;

  return (
    <section>
      <h2 className="font-display mb-4 text-lg font-bold">{t('cast')}</h2>
      <div className="scrollbar-custom flex gap-3 overflow-x-auto pb-3">
        {visibleCast.map((member) => {
          const photo = profileUrl(member.profile_path, 'md');
          return (
            <div
              key={member.id}
              className="flex w-[110px] shrink-0 flex-col overflow-hidden sm:w-[130px]"
            >
              <div className="bg-muted relative aspect-2/3 w-full overflow-hidden rounded-2xl">
                {photo ? (
                  <Image
                    src={photo}
                    alt={member.name}
                    fill
                    unoptimized
                    sizes="130px"
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-primary/10 text-primary flex h-full items-center justify-center text-lg font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="mt-2 min-w-0">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {member.character}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
