import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth callback handler for both:
 * 1. Email confirmation — receives token_hash + type params
 * 2. OAuth login — receives code param
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  const supabase = await createClient();

  // Email confirmation flow (signup, password recovery, email change).
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'recovery' | 'email',
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // OAuth flow (Google, GitHub, etc.).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, redirect to login with an error indicator.
  return NextResponse.redirect(`${origin}/en/login?error=auth`);
}
