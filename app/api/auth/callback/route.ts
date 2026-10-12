import { supabaseServer } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/callback?code=...&next=/some/path
 *
 * Supabase redirects here after email confirmation or OAuth.
 * Exchanges the one-time code for a session and redirects the user.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next');
  const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/account';

  if (code) {
    const db = await supabaseServer();
    if (db) {
      const { error } = await db.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Redirect to account with an error flag if exchange failed.
  return NextResponse.redirect(`${origin}/account?error=auth_callback`);
}
