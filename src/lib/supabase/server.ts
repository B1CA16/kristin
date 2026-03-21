import type { User } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Reads/writes auth cookies to maintain the user's session.
 * All queries are subject to RLS policies (runs as the authenticated user).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from Server Components where cookies can't be set.
            // This is fine — the middleware handles session refresh instead.
          }
        },
      },
    },
  );
}

/**
 * Safe wrapper around supabase.auth.getUser() that returns null
 * instead of throwing on network timeouts. Prevents Supabase
 * connectivity issues from crashing server renders.
 */
export async function getUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
