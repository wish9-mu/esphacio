import { supabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

function json(body: object, status = 200) {
  return NextResponse.json(body, { status });
}

/** POST /api/auth/signin — email/password sign-in */
export async function POST(request: Request) {
  const db = await supabaseServer();
  if (!db) return json({ error: 'Authentication service not configured.' }, 503);

  let email: string, password: string;
  try {
    const body = await request.json();
    email = String(body.email ?? '');
    password = String(body.password ?? '');
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  if (!email || !password) return json({ error: 'Email and password are required.' }, 400);

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return json({ error: error.message }, 401);

  return json({ ok: true });
}
