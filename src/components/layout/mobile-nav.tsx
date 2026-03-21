'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';

type Props = {
  profile: { username: string; avatarUrl: string | null } | null;
};

export function MobileNav({ profile }: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('common');
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu size={20} />
          <span className="sr-only">{t('openMenu')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left">Kristin</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-4 px-4">
          {profile ? (
            <>
              <div className="flex items-center gap-3 py-2">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.username}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                    <User size={16} />
                  </div>
                )}
                <span className="font-medium">{profile.username}</span>
              </div>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                {t('logout')}
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="ghost" asChild onClick={() => setOpen(false)}>
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button asChild onClick={() => setOpen(false)}>
                <Link href="/signup">{t('signUp')}</Link>
              </Button>
            </div>
          )}

          <div className="border-border/50 border-t pt-4">
            <Button
              variant="ghost"
              className="justify-start"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link href="/discover">{t('discover')}</Link>
            </Button>
          </div>

          <div className="border-border/50 border-t pt-4">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
