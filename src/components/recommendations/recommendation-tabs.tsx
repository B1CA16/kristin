'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

type RecommendationTabsProps = {
  communityContent: React.ReactNode;
  algorithmContent: React.ReactNode;
};

/**
 * Tabs switching between community-driven and algorithm-based recommendations.
 * Community picks are shown first (the core differentiator).
 */
export function RecommendationTabs({
  communityContent,
  algorithmContent,
}: RecommendationTabsProps) {
  const t = useTranslations('suggestions');
  const [tab, setTab] = useState<'community' | 'algorithm'>('community');

  return (
    <section>
      {/* Tab headers */}
      <div className="border-border mb-6 flex gap-1 border-b">
        <button
          onClick={() => setTab('community')}
          className={cn(
            'cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-colors',
            tab === 'community'
              ? 'border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground border-transparent',
          )}
        >
          {t('communityPicks')}
        </button>
        <button
          onClick={() => setTab('algorithm')}
          className={cn(
            'cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-colors',
            tab === 'algorithm'
              ? 'border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground border-transparent',
          )}
        >
          {t('algorithm')}
        </button>
      </div>

      {/* Tab content */}
      {tab === 'community' ? communityContent : algorithmContent}
    </section>
  );
}
