import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

type GenreBadgeProps = {
  id: number;
  name: string;
  mediaType: 'movie' | 'tv';
  className?: string;
};

/**
 * Clickable genre chip that links to the discover page
 * filtered by that genre.
 */
export function GenreBadge({
  id,
  name,
  mediaType,
  className,
}: GenreBadgeProps) {
  return (
    <Link
      href={`/search?type=${mediaType}&withGenres=${id}`}
      className={cn(
        'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        'inline-block rounded-full px-3 py-1 text-xs font-medium',
        'transition-all duration-200 hover:scale-105 hover:shadow-sm',
        className,
      )}
    >
      {name}
    </Link>
  );
}
