import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Shield,
  Info,
  Database,
  Cog,
  Globe,
  Scale,
  Clock,
  MessageCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('privacyPolicy') };
}

function Section({
  icon: Icon,
  title,
  description,
  items,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  items?: string[];
}) {
  return (
    <section className="bg-card/50 rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-[18px]" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="text-muted-foreground pl-12 leading-relaxed">
        {description}
      </p>
      {items && (
        <ul className="text-muted-foreground mt-3 space-y-1.5 pl-12 text-sm">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="bg-primary mt-2 size-1 shrink-0 rounded-full" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <div className="relative overflow-hidden">
      <div className="blob bg-primary/[0.06] absolute -top-20 left-0 size-96" />
      <div className="blob bg-primary/[0.04] absolute top-1/3 right-0 size-80" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl">
            <Shield className="size-7" />
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            {t('privacyPolicy')}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            {t('lastUpdated', { date: '2026-03-28' })}
          </p>
        </div>

        <div className="space-y-6">
          <Section
            icon={Info}
            title={t('privacy.introTitle')}
            description={t('privacy.introDesc')}
          />
          <Section
            icon={Database}
            title={t('privacy.collectTitle')}
            description={t('privacy.collectDesc')}
            items={[
              t('privacy.collectAccount'),
              t('privacy.collectContent'),
              t('privacy.collectUsage'),
            ]}
          />
          <Section
            icon={Cog}
            title={t('privacy.useTitle')}
            description={t('privacy.useDesc')}
            items={[
              t('privacy.useProvide'),
              t('privacy.useImprove'),
              t('privacy.useCommunicate'),
            ]}
          />
          <Section
            icon={Globe}
            title={t('privacy.thirdPartyTitle')}
            description={t('privacy.thirdPartyDesc')}
            items={[
              t('privacy.thirdPartySupabase'),
              t('privacy.thirdPartyVercel'),
              t('privacy.thirdPartyTmdb'),
            ]}
          />
          <Section
            icon={Scale}
            title={t('privacy.rightsTitle')}
            description={t('privacy.rightsDesc')}
            items={[
              t('privacy.rightsAccess'),
              t('privacy.rightsCorrect'),
              t('privacy.rightsDelete'),
              t('privacy.rightsExport'),
            ]}
          />
          <Section
            icon={Clock}
            title={t('privacy.retentionTitle')}
            description={t('privacy.retentionDesc')}
          />
          <Section
            icon={MessageCircle}
            title={t('privacy.contactTitle')}
            description={t('privacy.contactDesc')}
          />
        </div>
      </div>
    </div>
  );
}
