import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('privacyPolicy') };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display mb-8 text-3xl font-bold">
        {t('privacyPolicy')}
      </h1>
      <p className="text-muted-foreground mb-8 text-sm">
        {t('lastUpdated', { date: '2026-03-28' })}
      </p>

      <div className="prose prose-sm prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold">{t('privacy.introTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.introDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('privacy.collectTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.collectDesc')}
          </p>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6 text-sm">
            <li>{t('privacy.collectAccount')}</li>
            <li>{t('privacy.collectContent')}</li>
            <li>{t('privacy.collectUsage')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('privacy.useTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.useDesc')}
          </p>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6 text-sm">
            <li>{t('privacy.useProvide')}</li>
            <li>{t('privacy.useImprove')}</li>
            <li>{t('privacy.useCommunicate')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            {t('privacy.thirdPartyTitle')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.thirdPartyDesc')}
          </p>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6 text-sm">
            <li>{t('privacy.thirdPartySupabase')}</li>
            <li>{t('privacy.thirdPartyVercel')}</li>
            <li>{t('privacy.thirdPartyTmdb')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('privacy.rightsTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.rightsDesc')}
          </p>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6 text-sm">
            <li>{t('privacy.rightsAccess')}</li>
            <li>{t('privacy.rightsCorrect')}</li>
            <li>{t('privacy.rightsDelete')}</li>
            <li>{t('privacy.rightsExport')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            {t('privacy.retentionTitle')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.retentionDesc')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('privacy.contactTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('privacy.contactDesc')}
          </p>
        </section>
      </div>
    </div>
  );
}
