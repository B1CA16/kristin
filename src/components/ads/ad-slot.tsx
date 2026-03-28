'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { useConsent } from '@/providers/consent-provider';

type AdFormat = 'sidebar' | 'in-feed' | 'banner';

type AdSlotProps = {
  /** Ad format determines sizing and layout behavior. */
  format: AdFormat;
  className?: string;
};

/**
 * Dimension presets per ad format.
 * Reserving exact dimensions prevents CLS when the ad loads.
 */
const FORMAT_CONFIG: Record<AdFormat, { style: React.CSSProperties }> = {
  sidebar: { style: { minHeight: 250, width: '100%' } },
  'in-feed': { style: { minHeight: 250, width: '100%' } },
  banner: { style: { minHeight: 90, width: '100%' } },
};

/**
 * Google AdSense ad slot.
 *
 * Only renders when the user has consented to marketing cookies.
 * Reserves dimensions upfront to prevent layout shift (CLS).
 * Uses IntersectionObserver for lazy initialization — ads outside
 * the viewport don't load until scrolled into view.
 */
export function AdSlot({ format, className }: AdSlotProps) {
  const { consent } = useConsent();
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!consent?.marketing) return;
    if (initialized.current) return;
    if (!adRef.current) return;

    // Lazy-load: only push ad when slot enters viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !initialized.current) {
          initialized.current = true;
          try {
            const adsbygoogle = (window as AdSenseWindow).adsbygoogle || [];
            adsbygoogle.push({});
          } catch {
            // AdSense not loaded (blocked or script missing)
          }
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(adRef.current);
    return () => observer.disconnect();
  }, [consent?.marketing]);

  // Don't render anything if user hasn't consented to marketing
  if (!consent?.marketing) return null;

  const { style } = FORMAT_CONFIG[format];

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden',
        className,
      )}
      style={style}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || ''}
        data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || ''}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

type AdSenseWindow = typeof window & {
  adsbygoogle?: Record<string, unknown>[];
};
