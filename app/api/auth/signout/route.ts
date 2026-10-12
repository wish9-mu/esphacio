import { supabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/** POST /api/auth/signout */
export async function POST() {
  const db = await supabaseServer();
  if (db) await db.auth.signOut();
  return NextResponse.json({ ok: true });
}
