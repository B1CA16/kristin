import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Film, Search, Sparkles, Star, Tv, Users } from 'lucide-react';
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
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion';
import type { MovieListResult, TVListResult } from '@/lib/tmdb/types';

const TMDBTrending = dynamic(() =>
  import('@/components/discover/tmdb-trending').then((m) => ({
    default: m.TMDBTrending,
  })),
);

export default async function Home() {
  const locale = await getLocale();
  const t = await getTranslations('home');
  const user = await getUser();
  const isLoggedIn = !!user;

  const [{ data: kristinTrending }, { data: popularRecs }, tmdbTrending] =
    await Promise.all([
      getTrendingOnKristin(6),
      getPopularRecommendations(6),
      getTrending('all', 'day', { locale }),
    ]);

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
    <div className="overflow-hidden">
      {/* ====== HERO ====== */}
      <section className="noise-texture relative min-h-[calc(100dvh-4rem)] overflow-hidden">
        {/* Backdrop */}
        {heroBackdrop && (
          <Image
            src={heroBackdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="animate-backdrop-zoom object-cover object-top"
          />
        )}

        {/* Overlays */}
        {/* Darker overlays for cleaner text readability */}
        <div className="bg-background/80 dark:bg-background/85 absolute inset-0" />
        <div className="from-background/60 absolute inset-0 bg-gradient-to-r to-transparent dark:from-black/40" />
        <div className="from-background via-background/80 absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t to-transparent" />

        {/* Decorative blobs — purple only */}
        <div className="blob bg-primary/15 absolute -top-32 -right-32 size-96" />
        <div className="blob bg-primary/10 absolute -bottom-20 -left-20 size-80" />

        {/* Content */}
        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="max-w-2xl" staggerDelay={0.15}>
            <StaggerItem>
              <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <Sparkles className="size-4" />
                {t('communityPowered')}
              </div>
            </StaggerItem>
            <StaggerItem>
              <h1 className="font-display text-5xl leading-[1.1] font-bold tracking-tight sm:text-6xl lg:text-7xl">
                <span className="from-primary bg-gradient-to-r to-[oklch(0.7_0.25_300)] bg-clip-text text-transparent">
                  {t('heroHighlight')}
                </span>{' '}
                {t('heroRest')}{' '}
                <span className="relative">
                  {t('heroUnderline')}
                  <svg
                    className="text-primary/60 absolute -bottom-1 left-0 h-3 w-full"
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 8 Q50 2 100 8 Q150 14 198 6"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="text-muted-foreground mt-6 max-w-lg text-lg leading-relaxed sm:text-xl">
                {t('subtitle')}
              </p>
            </StaggerItem>
            <StaggerItem>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {!isLoggedIn && (
                  <Button size="lg" className="rounded-full px-8" asChild>
                    <Link href="/signup">{t('getStarted')}</Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8"
                  asChild
                >
                  <Link href="/search">{t('browse')}</Link>
                </Button>
              </div>
            </StaggerItem>

            {/* Featured item */}
            {heroItem && (
              <StaggerItem>
                <div className="bg-card/50 mt-10 inline-flex items-center gap-3 rounded-2xl p-3 pr-5 backdrop-blur-sm">
                  <span className="animate-glow-pulse bg-primary/20 text-primary rounded-full px-3 py-1 text-[11px] font-semibold">
                    {t('featured')}
                  </span>
                  <Link
                    href={`/${heroMediaType}/${heroItem.id}`}
                    className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    {heroMediaType === 'movie' ? (
                      <Film className="size-3.5" />
                    ) : (
                      <Tv className="size-3.5" />
                    )}
                    {heroTitle}
                  </Link>
                </div>
              </StaggerItem>
            )}
          </StaggerContainer>
        </div>
      </section>

      {/* ====== HOW IT WORKS — slanted section ====== */}
      <section className="slant-top slant-bottom noise-texture bg-primary/[0.04] dark:bg-primary/[0.03] relative">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="font-display mb-12 text-center text-3xl font-bold sm:text-4xl">
              {t('howItWorksTitle')}
            </h2>
          </FadeIn>
          <StaggerContainer className="grid gap-8 sm:grid-cols-3">
            <StaggerItem>
              <StepCard
                step={1}
                icon={<Search className="size-6" />}
                title={t('step1Title')}
                description={t('step1Desc')}
                color="bg-primary"
              />
            </StaggerItem>
            <StaggerItem>
              <StepCard
                step={2}
                icon={<Users className="size-6" />}
                title={t('step2Title')}
                description={t('step2Desc')}
                color="bg-primary/80"
              />
            </StaggerItem>
            <StaggerItem>
              <StepCard
                step={3}
                icon={<Star className="size-6" />}
                title={t('step3Title')}
                description={t('step3Desc')}
                color="bg-primary/60"
              />
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ====== CONTENT SECTIONS ====== */}
      <div className="relative mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
        {/* Decorative background elements */}
        <div className="blob bg-primary/[0.07] absolute -top-20 -left-40 size-96" />
        <div className="blob bg-primary/[0.05] absolute top-1/3 -right-32 size-80" />
        <div className="blob bg-primary/[0.06] absolute bottom-1/4 -left-24 size-72" />

        {kristinTrending.length > 0 && (
          <FadeIn>
            <MediaRow
              title={t('trendingOnKristin')}
              trailing={
                <Link
                  href="/discover"
                  className="text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-200"
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
          </FadeIn>
        )}

        <FadeIn>
          <TMDBTrending />
        </FadeIn>

        {popularRecs.length > 0 && (
          <FadeIn>
            <MediaRow
              title={t('popularRecommendations')}
              trailing={
                <Link
                  href="/discover"
                  className="text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-200"
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
          </FadeIn>
        )}
      </div>

      {/* ====== BOTTOM CTA ====== */}
      {!isLoggedIn && (
        <FadeIn>
          <section className="noise-texture relative overflow-hidden py-20">
            {/* Decorative blobs */}
            <div className="blob bg-primary/15 absolute -top-10 left-1/4 size-72" />
            <div className="blob bg-primary/10 absolute right-1/4 -bottom-10 size-64" />

            <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                {t('joinTitle')}
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                {t('joinSubtitle')}
              </p>
              <Button size="lg" className="mt-8 rounded-full px-10" asChild>
                <Link href="/signup">{t('joinCta')}</Link>
              </Button>
            </div>
          </section>
        </FadeIn>
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
  color,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group bg-card ring-border/50 relative rounded-3xl p-6 ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Step number as giant background text */}
      <span className="font-display text-foreground/5 absolute top-2 right-4 text-7xl font-bold">
        {step}
      </span>

      <div
        className={`${color} mb-4 flex size-14 items-center justify-center rounded-2xl text-white shadow-lg`}
      >
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
