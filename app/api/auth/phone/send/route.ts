import { supabaseServer } from '@/lib/supabase';
import { normalizePhilippineMobile } from '@/lib/phone';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const db = await supabaseServer();
  if (!db) return NextResponse.json({ error: 'Authentication service not configured.' }, { status: 503 });
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  let body: { phone?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const phone = normalizePhilippineMobile(String(body.phone ?? ''));
  if (!phone) return NextResponse.json({ error: 'Enter a valid Philippine mobile number.' }, { status: 400 });

  const demo = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_PHONE_OTP_DEMO === 'true';
  if (demo) return NextResponse.json({ ok: true, demo: true, phone });

  const { error } = await db.auth.updateUser({ phone });
  if (error) return NextResponse.json({ error: 'We could not send a verification code. Try again later.' }, { status: 400 });
  await db.from('profiles').update({ phone }).eq('id', user.id);
  return NextResponse.json({ ok: true, demo: false, phone });
}
