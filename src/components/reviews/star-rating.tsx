'use client';

import { useCallback, useId, useState } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Size = 'sm' | 'md' | 'lg';

type StarRatingBaseProps = {
  /** Size preset: sm (16px), md (20px), lg (28px). */
  size?: Size;
  className?: string;
};

type DisplayProps = StarRatingBaseProps & {
  /** Read-only mode. */
  interactive?: false;
  /** Rating on the 1-10 scale. */
  rating: number;
  /** Show numeric label next to stars (e.g. "7/10"). */
  showLabel?: boolean;
};

type InteractiveProps = StarRatingBaseProps & {
  /** Interactive mode — user can click to rate. */
  interactive: true;
  /** Currently selected rating (1-10) or 0 for unset. */
  rating: number;
  /** Called when the user selects a rating. */
  onChange: (rating: number) => void;
};

export type StarRatingProps = DisplayProps | InteractiveProps;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAR_COUNT = 5;

const SIZE_MAP: Record<Size, { px: number; gap: string; labelClass: string }> =
  {
    sm: { px: 16, gap: 'gap-0.5', labelClass: 'text-xs' },
    md: { px: 20, gap: 'gap-0.5', labelClass: 'text-sm' },
    lg: { px: 28, gap: 'gap-1', labelClass: 'text-base' },
  };

// ---------------------------------------------------------------------------
// Star SVG paths (Heroicons solid star)
// ---------------------------------------------------------------------------

function StarIcon({
  fill,
  sizePx,
  gradientId,
}: {
  fill: 'full' | 'half' | 'empty';
  sizePx: number;
  gradientId: string;
}) {
  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {fill === 'half' && (
        <defs>
          <linearGradient id={gradientId}>
            <stop
              offset="50%"
              stopColor="currentColor"
              className="text-amber-400"
            />
            <stop
              offset="50%"
              stopColor="currentColor"
              className="text-muted-foreground/25"
            />
          </linearGradient>
        </defs>
      )}
      <path
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
        fill={
          fill === 'full'
            ? 'currentColor'
            : fill === 'half'
              ? `url(#${gradientId})`
              : 'currentColor'
        }
        className={cn(
          fill === 'full' && 'text-amber-400',
          fill === 'empty' && 'text-muted-foreground/25',
        )}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Display mode
// ---------------------------------------------------------------------------

function DisplayStarRating({
  rating,
  size = 'md',
  showLabel = false,
  className,
}: DisplayProps) {
  const instanceId = useId();
  const { px, gap, labelClass } = SIZE_MAP[size];
  // Convert 1-10 to 0.5-5.0 stars
  const starValue = rating / 2;

  return (
    <div
      className={cn('flex items-center', gap, className)}
      role="img"
      aria-label={`${rating / 2} out of 5`}
    >
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const starIndex = i + 1;
        let fill: 'full' | 'half' | 'empty';
        if (starValue >= starIndex) {
          fill = 'full';
        } else if (starValue >= starIndex - 0.5) {
          fill = 'half';
        } else {
          fill = 'empty';
        }
        return (
          <StarIcon
            key={i}
            fill={fill}
            sizePx={px}
            gradientId={`${instanceId}-star-${i}`}
          />
        );
      })}
      {showLabel && (
        <span
          className={cn('text-muted-foreground ml-1 font-medium', labelClass)}
        >
          {rating / 2}/5
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interactive mode
// ---------------------------------------------------------------------------

function InteractiveStarRating({
  rating,
  onChange,
  size = 'lg',
  className,
}: InteractiveProps) {
  const instanceId = useId();
  const { px, gap } = SIZE_MAP[size];
  const [hoverValue, setHoverValue] = useState(0);

  const displayRating = hoverValue || rating;
  const starValue = displayRating / 2;

  const handleClick = useCallback(
    (value: number) => {
      // Clicking the same value clears it
      onChange(value === rating ? 0 : value);
    },
    [onChange, rating],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        onChange(Math.min(10, rating + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        onChange(Math.max(0, rating - 1));
      }
    },
    [onChange, rating],
  );

  return (
    <div
      className={cn('flex items-center', gap, className)}
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => setHoverValue(0)}
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const starIndex = i + 1;
        // Each star has two halves: left = (i*2)+1, right = (i*2)+2
        const leftValue = i * 2 + 1;
        const rightValue = i * 2 + 2;

        let fill: 'full' | 'half' | 'empty';
        if (starValue >= starIndex) {
          fill = 'full';
        } else if (starValue >= starIndex - 0.5) {
          fill = 'half';
        } else {
          fill = 'empty';
        }

        return (
          <span
            key={i}
            className="relative cursor-pointer"
            style={{ width: px, height: px }}
            tabIndex={i === 0 ? 0 : -1}
            role="radio"
            aria-checked={rating === leftValue || rating === rightValue}
            aria-label={`${starIndex} star${starIndex !== 1 ? 's' : ''}`}
          >
            <StarIcon
              fill={fill}
              sizePx={px}
              gradientId={`${instanceId}-star-${i}`}
            />
            {/* Left half hit target */}
            <button
              type="button"
              className="absolute inset-y-0 left-0 w-1/2"
              aria-label={`${leftValue / 2} stars`}
              onClick={() => handleClick(leftValue)}
              onMouseEnter={() => setHoverValue(leftValue)}
              tabIndex={-1}
            />
            {/* Right half hit target */}
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-1/2"
              aria-label={`${rightValue / 2} stars`}
              onClick={() => handleClick(rightValue)}
              onMouseEnter={() => setHoverValue(rightValue)}
              tabIndex={-1}
            />
          </span>
        );
      })}
      {displayRating > 0 && (
        <span className="text-muted-foreground ml-1 text-sm font-medium">
          {displayRating / 2}/5
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function StarRating(props: StarRatingProps) {
  if (props.interactive) {
    return <InteractiveStarRating {...props} />;
  }
  return <DisplayStarRating {...props} />;
}
