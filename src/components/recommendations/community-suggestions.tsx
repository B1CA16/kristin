'use client';

import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared/empty-state';

import type { SuggestionWithVoteStatus } from '@/actions/suggestions';
import { SuggestionCard } from './suggestion-card';

const AddSuggestionDialog = dynamic(() =>
  import('./add-suggestion-dialog').then((m) => ({
    default: m.AddSuggestionDialog,
  })),
);

type CommunitySuggestionsProps = {
  suggestions: SuggestionWithVoteStatus[];
  /** Pre-fetched target media info keyed by "type-tmdbId" */
  targetInfo: Record<string, { title: string; posterPath: string | null }>;
  sourceTmdbId: number;
  sourceMediaType: 'movie' | 'tv';
  isLoggedIn: boolean;
  /** Current user's ID, used to prevent self-voting */
  currentUserId?: string;
};

/**
 * List of community suggestions with add button.
 * Sorted by vote count (highest first).
 */
export function CommunitySuggestions({
  suggestions,
  targetInfo,
  sourceTmdbId,
  sourceMediaType,
  isLoggedIn,
  currentUserId,
}: CommunitySuggestionsProps) {
  const t = useTranslations('suggestions');

  // The list arrives already ordered by compareSuggestions (community first,
  // then curated by rank), so partitioning preserves the intended order.
  const communityPicks = suggestions.filter((s) => s.source === 'community');
  const curatedPicks = suggestions.filter((s) => s.source === 'curated');

  const renderCard = (suggestion: SuggestionWithVoteStatus) => {
    const key = `${suggestion.targetType}-${suggestion.targetTmdbId}`;
    const info = targetInfo[key];
    return (
      <SuggestionCard
        key={suggestion.id}
        suggestion={suggestion}
        targetTitle={info?.title ?? 'Unknown'}
        targetPosterPath={info?.posterPath ?? null}
        isLoggedIn={isLoggedIn}
        isOwnSuggestion={suggestion.suggestedBy === currentUserId}
      />
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <AddSuggestionDialog
          sourceTmdbId={sourceTmdbId}
          sourceMediaType={sourceMediaType}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {communityPicks.length === 0 ? (
        <EmptyState icon={Sparkles} message={t('noSuggestions')} />
      ) : (
        <div className="space-y-2">{communityPicks.map(renderCard)}</div>
      )}

      {/* Seeded picks live in their own labelled block. The empty state above
          still shows when there are no real suggestions, so the invitation to
          contribute is never replaced by curated content. */}
      {curatedPicks.length > 0 && (
        <section className="mt-8">
          <h3 className="text-sm font-semibold">{t('curatedTitle')}</h3>
          <p className="text-muted-foreground mt-0.5 mb-3 text-xs">
            {t('curatedDescription')}
          </p>
          <div className="space-y-2">{curatedPicks.map(renderCard)}</div>
        </section>
      )}
    </div>
  );
}
