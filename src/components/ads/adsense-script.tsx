'use client';

import Script from 'next/script';

import { useConsent } from '@/providers/consent-provider';

/**
 * Loads the Google AdSense script only after marketing consent is given.
 *
 * Uses next/script with strategy="lazyOnload" to avoid blocking
 * page render and hurting Core Web Vitals (LCP/FID).
 */
export function AdSenseScript() {
  const { consent } = useConsent();

  if (!consent?.marketing) return null;

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      strategy="lazyOnload"
      crossOrigin="anonymous"
    />
  );
}
