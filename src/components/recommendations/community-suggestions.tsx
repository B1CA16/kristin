'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <AddSuggestionDialog
          sourceTmdbId={sourceTmdbId}
          sourceMediaType={sourceMediaType}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {suggestions.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {t('noSuggestions')}
        </p>
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion) => {
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
          })}
        </div>
      )}
    </div>
  );
}
