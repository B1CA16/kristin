import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

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
          <div className="flex gap-10">
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold tracking-wider uppercase">
                {t('explore')}
              </h4>
              <Link
                href="/discover"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t('discover')}
              </Link>
              <Link
                href="/search"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t('browse')}
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold tracking-wider uppercase">
                {t('account')}
              </h4>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href="/signup"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t('signUp')}
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold tracking-wider uppercase">
                {t('legal')}
              </h4>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t('privacyPolicy')}
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t('termsOfService')}
              </Link>
              <Link
                href="/cookie-policy"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t('cookiePolicy')}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-border/50 mt-10 flex flex-col items-center gap-2 border-t pt-6 sm:flex-row sm:justify-between">
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
