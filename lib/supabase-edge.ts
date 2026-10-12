/**
 * lib/supabase-edge.ts
 *
 * Edge-runtime-safe Supabase helpers. No imports from next/headers.
 * Used by proxy.ts (edge runtime) only.
 */
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

function envOrNull() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return { url, key };
}

/** Proxy client — updates cookies on the outgoing response (used in proxy.ts). */
export function supabaseProxy(request: NextRequest, response: NextResponse) {
  const env = envOrNull();
  if (!env) return { client: null, response };
  const client = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        toSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });
  return { client, response };
}
