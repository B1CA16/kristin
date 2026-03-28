/**
 * Cookie consent state management.
 *
 * Stores user's consent choice in a first-party cookie.
 * Essential cookies (auth, locale) are always allowed.
 * Marketing cookies (ads, third-party tracking) require explicit consent.
 */

export type ConsentState = {
  essential: true; // always true, cannot be declined
  marketing: boolean;
};

const CONSENT_COOKIE = 'cookie_consent';
const CONSENT_VERSION = 1; // bump when policy changes to re-prompt users

type StoredConsent = ConsentState & { version: number; timestamp: string };

/** Read consent state from cookie. Returns null if no consent recorded. */
export function getConsent(): ConsentState | null {
  if (typeof document === 'undefined') return null;

  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.split('=')[1];

  if (!raw) return null;

  try {
    const parsed: StoredConsent = JSON.parse(decodeURIComponent(raw));
    // Re-prompt if consent version is outdated
    if (parsed.version !== CONSENT_VERSION) return null;
    return { essential: true, marketing: parsed.marketing };
  } catch {
    return null;
  }
}

/** Save consent state to cookie (1-year expiry). */
export function setConsent(state: ConsentState): void {
  const stored: StoredConsent = {
    ...state,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };

  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(stored))};path=/;max-age=${maxAge};samesite=lax`;
}

/** Check if user has made a consent choice (regardless of what they chose). */
export function hasConsent(): boolean {
  return getConsent() !== null;
}

/** Check if marketing cookies are allowed. */
export function isMarketingAllowed(): boolean {
  return getConsent()?.marketing ?? false;
}
