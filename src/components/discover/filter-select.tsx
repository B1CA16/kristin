'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type FilterOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Width class for the popover content */
  width?: string;
};

/**
 * Styled dropdown select using Popover. Replaces native <select>
 * elements for a consistent look across browsers.
 */
export function FilterSelect({
  options,
  value,
  onChange,
  placeholder,
  width = 'w-[160px]',
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 min-w-[120px] justify-between gap-2 font-normal"
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('p-1', width)} align="start">
        <div className="max-h-[280px] overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(isSelected ? '' : option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                  'hover:bg-accent',
                  isSelected && 'font-medium',
                )}
              >
                <Check
                  className={cn(
                    'size-3.5',
                    isSelected ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {option.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
