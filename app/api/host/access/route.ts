import { supabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

function json(body: object, status = 200) {
  return NextResponse.json(body, { status });
}

/** POST /api/host/access — securely transition the current renter to host. */
export async function POST() {
  const db = await supabaseServer();
  if (!db) return json({ error: 'Authentication service not configured.' }, 503);

  const { data: { user } } = await db.auth.getUser();
  if (!user) return json({ error: 'Authentication required.' }, 401);

  const { data: role, error } = await db.rpc('request_host_access');
  if (error || role !== 'host') {
    return json({ error: 'Only renter accounts can become hosts.' }, 403);
  }

  return json({ ok: true, role: 'host' });
}
