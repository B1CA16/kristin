import { useCallback, useEffect, useRef } from 'react';

/**
 * Triggers a callback when a sentinel element scrolls into view.
 * Uses IntersectionObserver for efficient scroll detection.
 *
 * Returns a ref to attach to your sentinel element (e.g. a div at the
 * bottom of a list). When it becomes visible, `onLoadMore` fires —
 * unless `hasMore` is false or `isLoading` is true.
 *
 * @param onLoadMore - called when the sentinel enters the viewport
 * @param options.hasMore - set to false to stop observing
 * @param options.isLoading - prevents duplicate triggers while fetching
 * @param options.rootMargin - how far before the sentinel to trigger (default "200px")
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  options: {
    hasMore: boolean;
    isLoading: boolean;
    rootMargin?: string;
  },
) {
  const { hasMore, isLoading, rootMargin = '200px' } = options;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Stable reference to the latest callback without re-creating the observer
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  const observe = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node;
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, rootMargin]);

  return observe;
}
