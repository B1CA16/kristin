import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('cookiePolicy') };
}

export default async function CookiePolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display mb-8 text-3xl font-bold">
        {t('cookiePolicy')}
      </h1>
      <p className="text-muted-foreground mb-8 text-sm">
        {t('lastUpdated', { date: '2026-03-28' })}
      </p>

      <div className="prose prose-sm prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold">
            {t('cookie.whatAreCookies')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('cookie.whatAreCookiesDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            {t('cookie.essentialTitle')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('cookie.essentialDesc')}
          </p>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6 text-sm">
            <li>{t('cookie.essentialAuth')}</li>
            <li>{t('cookie.essentialLocale')}</li>
            <li>{t('cookie.essentialConsent')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            {t('cookie.analyticsTitle')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('cookie.analyticsDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            {t('cookie.marketingTitle')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('cookie.marketingDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('cookie.manageTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('cookie.manageDesc')}
          </p>
        </section>
      </div>
    </div>
  );
}
