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
 */
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function notify() {
  listeners.forEach((cb) => cb());
}

function getConsentSnapshot(): ConsentState | null {
  return getConsent();
}

function getHasConsentedSnapshot(): boolean {
  return checkHasConsent();
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
