import Image from 'next/image';
import { Film, Search, Star, Tv, Users } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { backdropUrl } from '@/lib/tmdb/image';
import { getTrending } from '@/lib/tmdb';
import { getUser } from '@/lib/supabase/server';
import {
  getTrendingOnKristin,
  getPopularRecommendations,
} from '@/actions/discover';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { MediaCard } from '@/components/media/media-card';
import { MediaRow } from '@/components/media/media-row';
import { TMDBTrending } from '@/components/discover/tmdb-trending';
import type { MovieListResult, TVListResult } from '@/lib/tmdb/types';

export default async function Home() {
  const locale = await getLocale();
  const t = await getTranslations('home');
  const user = await getUser();
  const isLoggedIn = !!user;

  // Fetch data in parallel
  const [{ data: kristinTrending }, { data: popularRecs }, tmdbTrending] =
    await Promise.all([
      getTrendingOnKristin(6),
      getPopularRecommendations(6),
      getTrending('all', 'day', { locale }),
    ]);

  // Pick a random trending item with a backdrop for the hero
  const heroItems = (tmdbTrending.results ?? []).filter((r) => r.backdrop_path);
  const heroItem =
    heroItems.length > 0
      ? heroItems[new Date().getDate() % Math.min(5, heroItems.length)]
      : null;
  const heroBackdrop = heroItem
    ? backdropUrl(heroItem.backdrop_path, 'lg')
    : null;
  const heroTitle =
    heroItem && 'title' in heroItem
      ? (heroItem as MovieListResult).title
      : heroItem
        ? (heroItem as TVListResult).name
        : '';
  const heroMediaType = heroItem && 'title' in heroItem ? 'movie' : 'tv';

  return (
    <div>
      {/* Hero with backdrop */}
      <section className="relative overflow-hidden">
        {/* Backdrop image */}
        {heroBackdrop && (
          <Image
            src={heroBackdrop}
            alt=""
            fill
            unoptimized
            priority
            className="object-cover object-top"
          />
        )}

        {/* Gradient overlays — theme-aware for light/dark mode */}
        <div className="bg-background/80 dark:bg-background/75 absolute inset-0" />
        <div className="from-background/60 absolute inset-0 bg-gradient-to-r to-transparent dark:from-black/40" />
        <div className="from-background absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t" />

        {/* Content */}
        <div className="relative mx-auto max-w-4xl px-4 py-20 sm:py-28 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-lg text-lg sm:text-xl">
              {t('subtitle')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {!isLoggedIn && (
                <Button size="lg" asChild>
                  <Link href="/signup">{t('getStarted')}</Link>
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <Link href="/search">{t('browse')}</Link>
              </Button>
            </div>
          </div>

          {/* Featured item */}
          {heroItem && (
            <div className="mt-8 inline-flex items-center gap-2">
              <span className="bg-primary/20 text-primary rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                {t('featured')}
              </span>
              <Link
                href={`/${heroMediaType}/${heroItem.id}`}
                className="text-foreground/70 hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
              >
                {heroMediaType === 'movie' ? (
                  <Film className="size-3.5" />
                ) : (
                  <Tv className="size-3.5" />
                )}
                {heroTitle}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="border-border/50 border-b py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold">
            {t('howItWorksTitle')}
          </h2>
          <div className="grid gap-10 sm:grid-cols-3">
            <StepCard
              step={1}
              icon={<Search className="size-5" />}
              title={t('step1Title')}
              description={t('step1Desc')}
            />
            <StepCard
              step={2}
              icon={<Users className="size-5" />}
              title={t('step2Title')}
              description={t('step2Desc')}
            />
            <StepCard
              step={3}
              icon={<Star className="size-5" />}
              title={t('step3Title')}
              description={t('step3Desc')}
            />
          </div>
        </div>
      </section>

      {/* Content sections */}
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        {kristinTrending.length > 0 && (
          <MediaRow
            title={t('trendingOnKristin')}
            trailing={
              <Link
                href="/discover"
                className="text-primary text-sm font-medium hover:underline"
              >
                {t('seeAll')}
              </Link>
            }
          >
            {kristinTrending.map((item) => (
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
          </MediaRow>
        )}

        <TMDBTrending />

        {popularRecs.length > 0 && (
          <MediaRow
            title={t('popularRecommendations')}
            trailing={
              <Link
                href="/discover"
                className="text-primary text-sm font-medium hover:underline"
              >
                {t('seeAll')}
              </Link>
            }
          >
            {popularRecs.map((item) => (
              <MediaCard
                key={`${item.targetType}-${item.targetTmdbId}`}
                id={item.targetTmdbId}
                mediaType={item.targetType}
                title={item.title}
                posterPath={item.posterPath}
                releaseDate={item.releaseDate ?? undefined}
                voteAverage={item.voteAverage ?? undefined}
              />
            ))}
          </MediaRow>
        )}
      </div>

      {/* Bottom CTA */}
      {!isLoggedIn && (
        <section className="border-border/50 border-t">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
            <h2 className="text-2xl font-bold sm:text-3xl">{t('joinTitle')}</h2>
            <p className="text-muted-foreground mt-3 text-lg">
              {t('joinSubtitle')}
            </p>
            <Button size="lg" className="mt-6" asChild>
              <Link href="/signup">{t('joinCta')}</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="bg-primary text-primary-foreground mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
        {icon}
      </div>
      <div className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
        {step}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
