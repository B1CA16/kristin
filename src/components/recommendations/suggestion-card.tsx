'use client';

import Image from 'next/image';
import { ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { posterUrl } from '@/lib/tmdb/image';
import { Link } from '@/i18n/navigation';
import { useOptimisticVote } from '@/hooks/use-optimistic-vote';
import { ReputationBadge } from '@/components/profile/reputation-badge';
import type { SuggestionWithVoteStatus } from '@/actions/suggestions';

type SuggestionCardProps = {
  suggestion: SuggestionWithVoteStatus;
  /** Title and poster fetched from TMDB for the target media */
  targetTitle: string;
  targetPosterPath: string | null;
  isLoggedIn: boolean;
  /** Whether the current user created this suggestion */
  isOwnSuggestion: boolean;
};

/**
 * A single community suggestion card with poster, title, reason,
 * vote count, and upvote button with optimistic UI.
 */
export function SuggestionCard({
  suggestion,
  targetTitle,
  targetPosterPath,
  isLoggedIn,
  isOwnSuggestion,
}: SuggestionCardProps) {
  const t = useTranslations('suggestions');
  const poster = posterUrl(targetPosterPath, 'sm');

  const { voteCount, hasVoted, isPending, toggleVote } = useOptimisticVote(
    suggestion.id,
    {
      voteCount: suggestion.voteCount,
      hasVoted: suggestion.hasVoted,
    },
  );

  return (
    <div
      className={cn(
        'bg-card border-primary/20 flex gap-3 rounded-2xl border-l-4 p-4 shadow-sm',
        'transition-all duration-300',
        'hover:border-primary/50 hover:shadow-lg',
      )}
    >
      {/* Vote button */}
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={isLoggedIn && !isOwnSuggestion ? toggleVote : undefined}
          disabled={isPending || !isLoggedIn || isOwnSuggestion}
          title={
            !isLoggedIn
              ? t('loginToVote')
              : isOwnSuggestion
                ? t('cannotVoteOwn')
                : undefined
          }
          className={cn(
            'flex size-8 cursor-pointer flex-col items-center justify-center rounded-lg transition-all duration-200',
            hasVoted
              ? 'bg-primary text-primary-foreground shadow-primary/25 shadow-md'
              : 'bg-primary/5 text-muted-foreground hover:bg-primary/15 hover:text-primary',
            (!isLoggedIn || isPending || isOwnSuggestion) &&
              'cursor-not-allowed opacity-50',
          )}
        >
          <ChevronUp className="size-5" />
        </button>
        <span
          className={cn(
            'mt-2 text-sm font-bold',
            hasVoted ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {voteCount}
        </span>
      </div>

      {/* Poster thumbnail */}
      <Link
        href={`/${suggestion.targetType}/${suggestion.targetTmdbId}`}
        className="bg-muted relative h-[72px] w-12 shrink-0 overflow-hidden rounded-xl"
      >
        {poster ? (
          <Image
            src={poster}
            alt={targetTitle}
            fill
            unoptimized
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-foreground text-[10px]">?</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <Link
          href={`/${suggestion.targetType}/${suggestion.targetTmdbId}`}
          className="truncate text-sm font-medium hover:underline"
        >
          {targetTitle}
        </Link>
        {suggestion.reason && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
            {suggestion.reason}
          </p>
        )}
        <div className="mt-1 flex items-center gap-1.5">
          <p className="text-muted-foreground text-[11px]">
            {t('suggestedBy', { username: suggestion.suggestedByUsername })}
          </p>
          <ReputationBadge reputation={suggestion.suggestedByReputation} />
        </div>
      </div>
    </div>
  );
}
