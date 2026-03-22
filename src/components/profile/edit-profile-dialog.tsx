'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updateProfile } from '@/actions/profile';
import type { PublicProfile } from '@/actions/profile';

type EditProfileDialogProps = {
  profile: PublicProfile;
};

export function EditProfileDialog({ profile }: EditProfileDialogProps) {
  const t = useTranslations('profile');
  const router = useRouter();
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [publicFavorites, setPublicFavorites] = useState(
    profile.publicFavorites,
  );
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setUsername(profile.username);
    setDisplayName(profile.displayName ?? '');
    setBio(profile.bio ?? '');
    setPublicFavorites(profile.publicFavorites);
    setError('');
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  }

  const handleSubmit = useCallback(() => {
    setError('');
    startTransition(async () => {
      const result = await updateProfile({
        username: username !== profile.username ? username : undefined,
        displayName,
        bio,
        publicFavorites,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setOpen(false);

      // Redirect to new profile URL if username changed
      if (result.newUsername && result.newUsername !== profile.username) {
        router.push(`/${locale}/profile/${result.newUsername}`);
      }
    });
  }, [username, displayName, bio, publicFavorites, profile, router, locale]);

  const inputClass = cn(
    'bg-secondary/50 text-foreground placeholder:text-muted-foreground',
    'h-10 w-full rounded-md border-none px-3 text-sm',
    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
  );

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t('editProfile')}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editProfile')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('editProfile')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="edit-username"
                className="text-muted-foreground mb-1.5 block text-sm"
              >
                {t('username')}
              </label>
              <input
                id="edit-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder={t('usernamePlaceholder')}
                maxLength={30}
                className={inputClass}
                autoComplete="off"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                {t('usernameHelp')}
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label
                htmlFor="edit-display-name"
                className="text-muted-foreground mb-1.5 block text-sm"
              >
                {t('displayName')}
              </label>
              <input
                id="edit-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('displayNamePlaceholder')}
                maxLength={50}
                className={inputClass}
                autoComplete="off"
              />
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="edit-bio"
                className="text-muted-foreground mb-1.5 block text-sm"
              >
                {t('bio')}
              </label>
              <textarea
                id="edit-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('bioPlaceholder')}
                rows={3}
                maxLength={300}
                className={cn(
                  'bg-secondary/50 text-foreground placeholder:text-muted-foreground',
                  'w-full resize-none rounded-md border-none p-3 text-sm',
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                )}
              />
            </div>

            {/* Public favorites toggle */}
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t('publicFavorites')}</p>
                <p className="text-muted-foreground text-xs">
                  {t('publicFavoritesHelp')}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={publicFavorites}
                onClick={() => setPublicFavorites(!publicFavorites)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
                  publicFavorites ? 'bg-primary' : 'bg-secondary',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform',
                    publicFavorites
                      ? 'translate-x-[22px]'
                      : 'translate-x-[2px]',
                    'mt-[2px]',
                  )}
                />
              </button>
            </label>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? t('saving') : t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
