import { cn } from '@/lib/utils';
import { StarRating } from '@/components/reviews/star-rating';

type RatingDistributionProps = {
  /** Array of ratings (1-10) from all reviews for this media. */
  ratings: number[];
  className?: string;
};

/**
 * Bar chart showing rating breakdown (grouped by star: 5, 4, 3, 2, 1),
 * average score, and total count.
 */
export function RatingDistribution({
  ratings,
  className,
}: RatingDistributionProps) {
  if (ratings.length === 0) return null;

  const total = ratings.length;
  const average = ratings.reduce((sum, r) => sum + r, 0) / total;

  // Group into 5 buckets (star levels 5 → 1)
  const buckets = [0, 0, 0, 0, 0];
  for (const r of ratings) {
    const starLevel = Math.ceil(r / 2);
    buckets[5 - starLevel]++;
  }

  const maxCount = Math.max(...buckets);

  return (
    <div
      className={cn('bg-card flex gap-6 rounded-2xl p-5 shadow-sm', className)}
    >
      {/* Average score */}
      <div className="flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold">
          {(average / 2).toFixed(1)}
        </span>
        <StarRating rating={Math.round(average)} size="sm" />
        <span className="text-muted-foreground mt-1.5 text-xs">
          {total} {total === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      {/* Bars */}
      <div className="flex flex-1 flex-col justify-center gap-2">
        {buckets.map((count, i) => {
          const starLevel = 5 - i;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={starLevel} className="flex items-center gap-2.5">
              <span className="text-muted-foreground w-4 text-right text-xs font-medium">
                {starLevel}
              </span>
              <div className="bg-primary/10 h-2.5 flex-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-muted-foreground w-6 text-xs">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
