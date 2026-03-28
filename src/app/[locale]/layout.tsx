import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { SetHtmlLang } from '@/components/layout/set-html-lang';
import { Toaster } from '@/components/ui/sonner';
import { ConsentProvider } from '@/providers/consent-provider';
import { CookieBanner } from '@/components/shared/cookie-banner';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://trykristin.vercel.app';

  return {
    title: {
      default: t('title'),
      template: `%s | ${t('title')}`,
    },
    description: t('description'),
    alternates: {
      languages: {
        en: `${siteUrl}/en`,
        pt: `${siteUrl}/pt`,
        es: `${siteUrl}/es`,
        fr: `${siteUrl}/fr`,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SetHtmlLang locale={locale} />
      <ConsentProvider>
        {children}
        <CookieBanner />
      </ConsentProvider>
      <Toaster position="bottom-right" />
    </NextIntlClientProvider>
  );
}
