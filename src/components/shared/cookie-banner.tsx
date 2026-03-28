'use client';

import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Cookie } from 'lucide-react';

import { useConsent } from '@/providers/consent-provider';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

/**
 * Bottom-bar cookie consent banner.
 *
 * Shown on first visit (before any consent choice is recorded).
 * Essential cookies are always on; marketing requires explicit opt-in.
 */
export function CookieBanner() {
  const t = useTranslations('consent');
  const { hasConsented, acceptAll, acceptEssentialOnly } = useConsent();

  return (
    <AnimatePresence>
      {!hasConsented && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-card/95 fixed inset-x-0 bottom-0 z-50 border-t border-white/10 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <div className="flex flex-1 items-start gap-3">
              <Cookie className="text-primary mt-0.5 size-5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('title')}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t('description')}{' '}
                  <Link
                    href="/cookie-policy"
                    className="text-primary hover:underline"
                  >
                    {t('learnMore')}
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 sm:ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={acceptEssentialOnly}
                className="text-xs"
              >
                {t('essentialOnly')}
              </Button>
              <Button size="sm" onClick={acceptAll} className="text-xs">
                {t('acceptAll')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
