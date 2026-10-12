import { supabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { normalizePhilippineMobile } from '@/lib/phone';

/** POST /api/auth/signup — email/password account creation (renter role auto-assigned by DB trigger) */
export async function POST(request: Request) {
  const db = await supabaseServer();
  if (!db) return NextResponse.json({ error: 'Authentication service not configured.' }, { status: 503 });

  let email: string, password: string, confirmPassword: string, fullName: string, role: string, phone: string;
  try {
    const body = await request.json();
    email = String(body.email ?? '').trim().toLowerCase();
    password = String(body.password ?? '');
    confirmPassword = String(body.confirmPassword ?? '');
    fullName = String(body.fullName ?? '').trim();
    role = String(body.role ?? 'tenant');
    phone = String(body.phone ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!fullName || fullName.length < 2 || fullName.length > 80) {
    return NextResponse.json({ error: 'Enter your full name (2–80 characters).' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return NextResponse.json({ error: 'Password must be at least 8 characters with a letter and number.' }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
  }
  if (role !== 'tenant' && role !== 'landlord') {
    return NextResponse.json({ error: 'Choose Tenant or Landlord.' }, { status: 400 });
  }

  const normalizedPhone = role === 'landlord' ? normalizePhilippineMobile(phone) : null;
  if (role === 'landlord' && !normalizedPhone) {
    return NextResponse.json({ error: 'Enter a valid Philippine mobile number.' }, { status: 400 });
  }

  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: { data: { display_name: fullName, full_name: fullName, landlord_requested: role === 'landlord', phone: normalizedPhone } },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, confirmEmail: !data.session, landlordRequested: role === 'landlord' });
}
