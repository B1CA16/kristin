import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

/**
 * Popular genre IDs from TMDB (stable — these don't change).
 * Creates crawlable internal links from every page to genre-filtered discover pages.
 */
const POPULAR_GENRES = [
  { id: 28, name: 'Action', type: 'movie' },
  { id: 35, name: 'Comedy', type: 'movie' },
  { id: 18, name: 'Drama', type: 'movie' },
  { id: 27, name: 'Horror', type: 'movie' },
  { id: 878, name: 'Sci-Fi', type: 'movie' },
  { id: 53, name: 'Thriller', type: 'movie' },
  { id: 16, name: 'Animation', type: 'movie' },
  { id: 10749, name: 'Romance', type: 'movie' },
] as const;

const linkClass =
  'text-muted-foreground hover:text-foreground text-sm transition-colors';

export function Footer() {
  const t = useTranslations('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="noise-texture relative overflow-hidden border-t border-white/10">
      {/* Subtle decorative blob */}
      <div className="blob bg-primary/[0.05] absolute -bottom-20 left-1/2 size-80 -translate-x-1/2" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Link
              href="/"
              className="font-display flex items-center gap-1 text-lg font-bold"
            >
              <Image
                src="/kristin_logo.svg"
                alt="Kristin"
                width={24}
                height={24}
                className="size-6"
              />
              <span className="from-primary bg-gradient-to-r to-[oklch(0.7_0.25_300)] bg-clip-text text-transparent">
                Kristin
              </span>
            </Link>
            <p className="text-muted-foreground max-w-xs text-center text-sm sm:text-left">
              {t('footerTagline')}
            </p>
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 sm:flex sm:gap-10">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wider uppercase">
                {t('explore')}
              </p>
              <Link href="/discover" className={linkClass}>
                {t('discover')}
              </Link>
              <Link href="/search" className={linkClass}>
                {t('browse')}
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wider uppercase">
                {t('account')}
              </p>
              <Link href="/login" className={linkClass}>
                {t('login')}
              </Link>
              <Link href="/signup" className={linkClass}>
                {t('signUp')}
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wider uppercase">
                {t('genres')}
              </p>
              {POPULAR_GENRES.slice(0, 4).map((genre) => (
                <Link
                  key={genre.id}
                  href={`/search?type=${genre.type}&withGenres=${genre.id}`}
                  className={linkClass}
                >
                  {genre.name}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wider uppercase">
                {t('legal')}
              </p>
              <Link href="/privacy" className={linkClass}>
                {t('privacyPolicy')}
              </Link>
              <Link href="/terms" className={linkClass}>
                {t('termsOfService')}
              </Link>
              <Link href="/cookie-policy" className={linkClass}>
                {t('cookiePolicy')}
              </Link>
            </div>
          </div>
        </div>

        {/* Genre chips row — additional crawlable links */}
        <div className="border-border/50 mt-8 flex flex-wrap justify-center gap-2 border-t pt-6">
          {POPULAR_GENRES.map((genre) => (
            <Link
              key={genre.id}
              href={`/search?type=${genre.type}&withGenres=${genre.id}`}
              className="bg-secondary/50 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full px-3 py-1 text-xs font-medium transition-colors"
            >
              {genre.name}
            </Link>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-border/50 mt-6 flex flex-col items-center gap-2 border-t pt-6 sm:flex-row sm:justify-between">
          <p className="text-muted-foreground text-xs">
            &copy; {currentYear} Kristin. {t('allRightsReserved')}
          </p>
          <p className="text-muted-foreground text-xs">
            {t('poweredBy')}{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              TMDB
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
