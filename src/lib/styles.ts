import { cn } from '@/lib/utils';

/** Shared input styling for text inputs across the app. */
export const inputClass = cn(
  'bg-secondary/50 text-foreground placeholder:text-muted-foreground',
  'h-10 w-full rounded-md border-none px-3 text-sm',
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
);

/** Shared textarea styling. */
export const textareaClass = cn(
  'bg-secondary/50 text-foreground placeholder:text-muted-foreground',
  'w-full resize-none rounded-md border-none p-3 text-sm',
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
);
