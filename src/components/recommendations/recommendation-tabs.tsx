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
      {/* Tab headers — pill style */}
      <div className="mb-6 flex gap-1.5">
        <button
          onClick={() => setTab('community')}
          className={cn(
            'cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200',
            tab === 'community'
              ? 'bg-primary text-primary-foreground shadow-primary/25 shadow-md'
              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
          )}
        >
          {t('communityPicks')}
        </button>
        <button
          onClick={() => setTab('algorithm')}
          className={cn(
            'cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200',
            tab === 'algorithm'
              ? 'bg-primary text-primary-foreground shadow-primary/25 shadow-md'
              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
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
