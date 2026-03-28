'use client';

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react';
import {
  type ConsentState,
  getConsent,
  hasConsent as checkHasConsent,
  setConsent,
} from '@/lib/consent';

type ConsentContextValue = {
  /** Whether the user has made a consent choice. */
  hasConsented: boolean;
  /** Current consent state. Null if no choice yet. */
  consent: ConsentState | null;
  /** Accept all cookies (essential + marketing). */
  acceptAll: () => void;
  /** Accept only essential cookies. */
  acceptEssentialOnly: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

/**
 * Simple pub/sub so useSyncExternalStore re-renders when consent changes.
 * Snapshots are cached to satisfy useSyncExternalStore's requirement that
 * getSnapshot returns the same reference between re-renders unless data changed.
 */
const listeners = new Set<() => void>();

let cachedConsent: ConsentState | null = null;
let cachedHasConsented = true; // default true to avoid banner flash on SSR

function updateCache() {
  cachedConsent = getConsent();
  cachedHasConsented = checkHasConsent();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  updateCache();
  listeners.forEach((cb) => cb());
}

function getConsentSnapshot(): ConsentState | null {
  return cachedConsent;
}

function getHasConsentedSnapshot(): boolean {
  return cachedHasConsented;
}

// Initialize cache on module load (client-side only)
if (typeof document !== 'undefined') {
  updateCache();
}

// Server snapshots — default to "consented" to avoid rendering the banner during SSR
const serverConsentSnapshot = (): ConsentState | null => null;
const serverHasConsentedSnapshot = (): boolean => true;

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const consent = useSyncExternalStore(
    subscribe,
    getConsentSnapshot,
    serverConsentSnapshot,
  );
  const hasConsented = useSyncExternalStore(
    subscribe,
    getHasConsentedSnapshot,
    serverHasConsentedSnapshot,
  );

  const acceptAll = useCallback(() => {
    setConsent({ essential: true, marketing: true });
    notify();
  }, []);

  const acceptEssentialOnly = useCallback(() => {
    setConsent({ essential: true, marketing: false });
    notify();
  }, []);

  return (
    <ConsentContext.Provider
      value={{ hasConsented, consent, acceptAll, acceptEssentialOnly }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
