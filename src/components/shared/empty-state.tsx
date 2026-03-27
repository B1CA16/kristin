import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  message: string;
  className?: string;
};

/**
 * Visual empty state with an icon and message.
 * Used when a section has no data to display.
 */
export function EmptyState({
  icon: Icon,
  message,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 py-12 ${className ?? ''}`}
    >
      <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
        <Icon className="size-6" />
      </div>
      <p className="text-muted-foreground max-w-xs text-center text-sm">
        {message}
      </p>
    </div>
  );
}
