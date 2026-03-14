import { useEffect, useState } from 'react';

/**
 * Debounces a value by the specified delay.
 * Returns the debounced value that only updates after the delay
 * has passed since the last change.
 *
 * Useful for search inputs — prevents firing an API call on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
