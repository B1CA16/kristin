import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/search/search-bar';
import { ScrollHeader } from '@/components/motion/scroll-header';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { UserMenu } from './user-menu';
import { MobileNav } from './mobile-nav';

export async function Navbar() {
  const t = await getTranslations('common');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; avatar_url: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const mobileProfile = profile
    ? { username: profile.username, avatarUrl: profile.avatar_url }
    : null;

  return (
    <ScrollHeader className="glass sticky top-0 z-50 border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display flex shrink-0 items-center gap-0.5 text-xl font-bold tracking-tight transition-transform duration-200 hover:scale-105"
        >
          <Image
            src="/kristin_logo.svg"
            alt="Kristin"
            width={30}
            height={30}
            className="size-9"
          />
          <span className="from-primary bg-gradient-to-r to-[oklch(0.7_0.25_300)] bg-clip-text text-transparent">
            Kristin
          </span>
        </Link>

        {/* Desktop search */}
        <SearchBar className="mx-4 hidden w-full max-w-xs md:block lg:max-w-sm" />

        {/* Desktop nav */}
        <div className="hidden shrink-0 items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discover">{t('discover')}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/search">{t('browse')}</Link>
          </Button>
          <LanguageSwitcher />
          <ThemeToggle />
          {profile ? (
            <UserMenu
              username={profile.username}
              avatarUrl={profile.avatar_url}
            />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">{t('signUp')}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile nav */}
        <MobileNav profile={mobileProfile} />
      </div>
    </ScrollHeader>
  );
}
