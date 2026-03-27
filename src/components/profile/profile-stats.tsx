import { useTranslations } from 'next-intl';
import { CountUp } from '@/components/motion';

type ProfileStatsProps = {
  reviewCount: number;
  suggestionCount: number;
  totalVotesReceived: number;
};

/**
 * Three stat cards showing review count, suggestion count,
 * and total votes received with animated counters.
 */
export function ProfileStats({
  reviewCount,
  suggestionCount,
  totalVotesReceived,
}: ProfileStatsProps) {
  const t = useTranslations('profile');

  const stats = [
    { value: reviewCount, label: t('reviewCount', { count: reviewCount }) },
    {
      value: suggestionCount,
      label: t('suggestionCount', { count: suggestionCount }),
    },
    {
      value: totalVotesReceived,
      label: t('votesReceived', { count: totalVotesReceived }),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card rounded-2xl p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <CountUp target={stat.value} className="text-2xl font-bold" />
          <p className="text-muted-foreground text-xs">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
