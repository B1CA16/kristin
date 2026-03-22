import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { getReputationTier, type ReputationTier } from '@/lib/reputation';

type ReputationBadgeProps = {
  reputation: number;
  size?: 'sm' | 'md';
  className?: string;
};

const TIER_COLORS: Record<ReputationTier, string> = {
  newcomer: 'bg-muted text-muted-foreground',
  contributor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  curator: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  tastemaker: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  legend: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

/**
 * Displays a colored reputation tier badge.
 * Tier is computed from the raw reputation number.
 */
export function ReputationBadge({
  reputation,
  size = 'sm',
  className,
}: ReputationBadgeProps) {
  const t = useTranslations('profile');
  const tier = getReputationTier(reputation);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
        size === 'md' && 'px-2.5 py-1 text-xs',
        TIER_COLORS[tier],
        className,
      )}
    >
      {t(`tier.${tier}`)}
    </span>
  );
}
