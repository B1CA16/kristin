import { type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Middleware that handles two concerns on every request:
 * 1. Auth session refresh — keeps the Supabase session alive by refreshing tokens via cookies.
 * 2. i18n locale routing — redirects to the correct locale prefix.
 *
 * Auth runs first so the session is fresh before any page renders.
 */
export async function middleware(request: NextRequest) {
  // Start with the i18n middleware response (handles locale redirect/rewrite).
  const response = intlMiddleware(request);

  // Layer Supabase auth on top — refresh the session by reading/writing cookies.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // getUser() triggers the token refresh if needed.
  // We don't need the result — the side effect (cookie refresh) is what matters.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
