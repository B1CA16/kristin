import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('termsOfService') };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display mb-8 text-3xl font-bold">
        {t('termsOfService')}
      </h1>
      <p className="text-muted-foreground mb-8 text-sm">
        {t('lastUpdated', { date: '2026-03-28' })}
      </p>

      <div className="prose prose-sm prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold">
            {t('terms.acceptanceTitle')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('terms.acceptanceDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('terms.accountTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('terms.accountDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('terms.contentTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('terms.contentDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('terms.conductTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('terms.conductDesc')}
          </p>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6 text-sm">
            <li>{t('terms.conductSpam')}</li>
            <li>{t('terms.conductAbuse')}</li>
            <li>{t('terms.conductImpersonate')}</li>
            <li>{t('terms.conductManipulate')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('terms.tmdbTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('terms.tmdbDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            {t('terms.terminationTitle')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('terms.terminationDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            {t('terms.disclaimerTitle')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('terms.disclaimerDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('terms.changesTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('terms.changesDesc')}
          </p>
        </section>
      </div>
    </div>
  );
}
