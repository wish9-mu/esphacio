import { type NextRequest, NextResponse } from 'next/server';
import { supabaseProxy } from '@/lib/supabase-edge';

/**
 * Refreshes the Supabase session cookie on every navigation request so that
 * Server Components receive an up-to-date session without needing a
 * dedicated /api/auth/refresh endpoint.
 *
 * Protected paths (/host/dashboard, /admin) are gated here so that a
 * missing session redirects to /account before the page renders.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { client } = supabaseProxy(request, response);

  // Refresh session tokens in the cookie store.
  if (client) {
    await client.auth.getUser();
  }

  // Server-side redirect for authenticated-only paths.
  const { pathname } = request.nextUrl;
  const protectedPrefixes = ['/host/dashboard', '/host/properties', '/admin'];
  if (protectedPrefixes.some(p => pathname.startsWith(p))) {
    if (!client) {
      // Supabase not configured — show the placeholder pages as before.
      return response;
    }
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/account';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip Next internals, static files and image optimization.
     * Match every other request including pages and API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
