import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'kristin-recent-items';
const MAX_RECENT = 5;

export type RecentItem = {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
};

const EMPTY: RecentItem[] = [];

/** Cached snapshot for referential stability. */
let cachedSnapshot: RecentItem[] = EMPTY;
let cachedRaw: string | null = null;

function getSnapshot(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedSnapshot = raw ? JSON.parse(raw) : EMPTY;
    }
    return cachedSnapshot;
  } catch {
    return EMPTY;
  }
}

function getServerSnapshot(): RecentItem[] {
  return EMPTY;
}

const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
function notify() {
  for (const listener of listeners) listener();
}

/**
 * Manages recently viewed media items in localStorage.
 * Stores the actual item (id, title, poster) so the dropdown
 * can render cards directly without re-fetching.
 */
export function useRecentSearches() {
  const recent = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const addItem = useCallback((item: RecentItem) => {
    const current = getSnapshot();
    const updated = [
      item,
      ...current.filter(
        (i) => !(i.id === item.id && i.mediaType === item.mediaType),
      ),
    ].slice(0, MAX_RECENT);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage full or unavailable
    }
    notify();
  }, []);

  const clearRecent = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
    notify();
  }, []);

  return { recent, addItem, clearRecent };
}
