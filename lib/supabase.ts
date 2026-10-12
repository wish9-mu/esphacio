/**
 * lib/supabase.ts
 *
 * Server-only Supabase helpers (Node.js runtime / Route Handlers / Server Components).
 * DO NOT import this file from proxy.ts — use lib/supabase-edge.ts there instead.
 */
import { createServerClient, createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

/** Server component / Route Handler client (reads and writes cookies). */
export async function supabaseServer() {
  const env = envOrNull();
  if (!env) return null;
  const jar = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) =>
            jar.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component — cookies will be set by
          // the proxy refresh path instead.
        }
      },
    },
  });
}

/** Browser client (singleton pattern — safe to call per render). */
export function supabaseBrowser() {
  const env = envOrNull();
  if (!env) return null;
  return createBrowserClient(env.url, env.key);
}
