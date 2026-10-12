import { supabaseServer } from '@/lib/supabase';
import { normalizePhilippineMobile } from '@/lib/phone';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const db = await supabaseServer();
  if (!db) return NextResponse.json({ error: 'Authentication service not configured.' }, { status: 503 });
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  let body: { phone?: string; token?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const phone = normalizePhilippineMobile(String(body.phone ?? ''));
  const token = String(body.token ?? '');
  if (!phone || !/^\d{6}$/.test(token)) return NextResponse.json({ error: 'Enter a valid six-digit code.' }, { status: 400 });

  const demo = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_PHONE_OTP_DEMO === 'true';
  if (demo) {
    if (token !== '123456') return NextResponse.json({ error: 'Demo code is 123456.' }, { status: 400 });
    return NextResponse.json({ ok: true, demo: true, status: 'phone_unverified' });
  }

  const { error } = await db.auth.verifyOtp({ phone, token, type: 'phone_change' });
  if (error) return NextResponse.json({ error: 'That code is invalid or expired.' }, { status: 400 });
  const { data: status, error: statusError } = await db.rpc('mark_phone_verified');
  if (statusError) return NextResponse.json({ error: 'Phone confirmation could not be recorded.' }, { status: 400 });
  return NextResponse.json({ ok: true, demo: false, status });
}
