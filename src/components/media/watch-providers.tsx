import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { logoUrl } from '@/lib/tmdb/image';
import type { WatchProviderCountry } from '@/lib/tmdb/types';

type WatchProvidersProps = {
  providers: WatchProviderCountry | undefined;
};

/**
 * Displays streaming, rent, and buy provider logos.
 * Data comes from TMDB's watch/providers endpoint.
 */
export function WatchProviders({ providers }: WatchProvidersProps) {
  const t = useTranslations('media');

  if (!providers) return null;

  const { flatrate, rent, buy, link } = providers;
  const hasAny = flatrate?.length || rent?.length || buy?.length;

  if (!hasAny) return null;

  return (
    <section>
      <h2 className="font-display mb-4 text-lg font-bold">
        {t('watchProviders')}
      </h2>

      <div className="flex flex-col gap-4">
        {flatrate && flatrate.length > 0 && (
          <ProviderRow label={t('stream')} providers={flatrate} />
        )}
        {rent && rent.length > 0 && (
          <ProviderRow label={t('rent')} providers={rent} />
        )}
        {buy && buy.length > 0 && (
          <ProviderRow label={t('buy')} providers={buy} />
        )}
      </div>

      {/* JustWatch attribution (required by TMDB ToS) */}
      <p className="text-muted-foreground mt-3 text-xs">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline underline-offset-2"
          >
            {t('watchProvidersAttribution')}
          </a>
        ) : (
          t('watchProvidersAttribution')
        )}
      </p>
    </section>
  );
}

function ProviderRow({
  label,
  providers,
}: {
  label: string;
  providers: {
    provider_id: number;
    provider_name: string;
    logo_path: string;
  }[];
}) {
  return (
    <div>
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => {
          const logo = logoUrl(provider.logo_path, 'md');
          return (
            <div
              key={provider.provider_id}
              title={provider.provider_name}
              className="bg-muted relative size-11 overflow-hidden rounded-xl"
            >
              {logo && (
                <Image
                  src={logo}
                  alt={provider.provider_name}
                  fill
                  unoptimized
                  sizes="40px"
                  className="object-cover"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
