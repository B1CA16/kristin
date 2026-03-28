'use client';

import { useCallback, useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ShareButtonProps = {
  /** URL path to share (e.g. /movie/123). Full URL is built automatically. */
  path: string;
  /** Title for the share sheet / social text. */
  title: string;
  /** UTM source label for attribution tracking. */
  utmSource?: string;
  /** Visual variant. */
  variant?: 'icon' | 'button';
  className?: string;
};

/** Social platform configs for share URLs. */
const PLATFORMS = [
  {
    name: 'X',
    icon: () => (
      <svg viewBox="0 0 24 24" className="size-4 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    url: (text: string, url: string) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Facebook',
    icon: () => (
      <svg viewBox="0 0 24 24" className="size-4 fill-current">
        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 7.834 7.834 0 0 0-.567-.01c-1.061 0-1.47.153-1.879.46-.41.307-.659.769-.659 1.859v1.662h3.637l-.724 3.667h-2.913v7.98z" />
      </svg>
    ),
    url: (_text: string, url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    icon: () => (
      <svg viewBox="0 0 24 24" className="size-4 fill-current">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    ),
    url: (text: string, url: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
] as const;

/**
 * Share button with native Web Share API on mobile,
 * dropdown with platform links + copy URL on desktop.
 */
export function ShareButton({
  path,
  title,
  utmSource = 'share',
  variant = 'icon',
  className,
}: ShareButtonProps) {
  const t = useTranslations('common');
  const [copied, setCopied] = useState(false);

  const getShareUrl = useCallback(
    (platform?: string) => {
      const baseUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'https://trykristin.vercel.app';
      const url = new URL(path, baseUrl);
      url.searchParams.set('utm_source', utmSource);
      if (platform) url.searchParams.set('utm_medium', platform);
      url.searchParams.set('utm_campaign', 'share');
      return url.toString();
    },
    [path, utmSource],
  );

  const handleNativeShare = useCallback(async () => {
    const url = getShareUrl('native');
    try {
      await navigator.share({ title, url });
      trackEvent('search', {
        query: title,
        filter: 'all',
        result_count: 0,
      });
    } catch {
      // User cancelled or API not available
    }
  }, [title, getShareUrl]);

  const handleCopy = useCallback(async () => {
    const url = getShareUrl('copy');
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getShareUrl]);

  const handlePlatformClick = useCallback(
    (platformName: string) => {
      const url = getShareUrl(platformName.toLowerCase());
      const platform = PLATFORMS.find((p) => p.name === platformName);
      if (platform) {
        window.open(
          platform.url(title, url),
          '_blank',
          'noopener,width=600,height=400',
        );
      }
    },
    [title, getShareUrl],
  );

  // Use native share only on mobile/tablet — desktop browsers (Chrome/Edge on
  // Windows) also support it but open the clunky OS share dialog instead of
  // something useful. The dropdown with platform links is better on desktop.
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const supportsNativeShare = isMobile && 'share' in navigator;

  if (supportsNativeShare) {
    return (
      <Button
        variant="ghost"
        size={variant === 'icon' ? 'icon' : 'sm'}
        onClick={handleNativeShare}
        title={t('share')}
        className={cn(
          'text-muted-foreground hover:bg-white/10 hover:text-white',
          variant === 'icon' && 'size-9',
          className,
        )}
      >
        <Share2 className="size-4" />
        {variant === 'button' && <span className="ml-1.5">{t('share')}</span>}
      </Button>
    );
  }

  // Desktop fallback: dropdown with platforms + copy link
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'icon' ? 'icon' : 'sm'}
          title={t('share')}
          className={cn(
            'text-muted-foreground hover:bg-white/10 hover:text-white',
            variant === 'icon' && 'size-9',
            className,
          )}
        >
          <Share2 className="size-4" />
          {variant === 'button' && <span className="ml-1.5">{t('share')}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {PLATFORMS.map((platform) => (
          <DropdownMenuItem
            key={platform.name}
            onClick={() => handlePlatformClick(platform.name)}
            className="gap-2"
          >
            <platform.icon />
            {platform.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={handleCopy} className="gap-2">
          {copied ? (
            <>
              <Check className="size-4" />
              {t('copied')}
            </>
          ) : (
            <>
              <Link2 className="size-4" />
              {t('copyLink')}
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
