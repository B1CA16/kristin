import { useTranslations } from 'next-intl';

type ProfileStatsProps = {
  reviewCount: number;
  suggestionCount: number;
  totalVotesReceived: number;
};

/**
 * Three stat cards showing review count, suggestion count,
 * and total votes received.
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
          className="bg-card ring-border rounded-lg p-4 text-center ring-1"
        >
          <p className="text-2xl font-bold">{stat.value}</p>
          <p className="text-muted-foreground text-xs">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
