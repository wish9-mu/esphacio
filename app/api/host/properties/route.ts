import { supabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

function json(body: object, status = 200) {
  return NextResponse.json(body, { status });
}

function validateFields(body: Record<string, unknown>) {
  const title = String(body.title ?? '').trim();
  if (title.length < 3 || title.length > 120) return 'Title must be 3–120 characters.';
  const city = String(body.city ?? '').trim();
  if (!city || city.length > 80) return 'City is required (max 80 chars).';
  const neighborhood = String(body.neighborhood ?? '').trim();
  if (!neighborhood || neighborhood.length > 80) return 'Neighbourhood is required (max 80 chars).';
  const monthly_rent = Number(body.monthly_rent);
  if (!isFinite(monthly_rent) || monthly_rent <= 0) return 'Monthly rent must be a positive number.';
  const monthly_dues = Number(body.monthly_dues ?? 0);
  if (!isFinite(monthly_dues) || monthly_dues < 0) return 'Monthly dues cannot be negative.';
  const cleaning_fee = Number(body.cleaning_fee ?? 0);
  if (!isFinite(cleaning_fee) || cleaning_fee < 0) return 'Cleaning fee cannot be negative.';
  const security_deposit = Number(body.security_deposit ?? 0);
  if (!isFinite(security_deposit) || security_deposit < 0) return 'Security deposit cannot be negative.';
  const area_sqm = Number(body.area_sqm);
  if (!isFinite(area_sqm) || area_sqm <= 0) return 'Area must be a positive number.';
  const min_months = Number(body.min_months ?? 1);
  if (!Number.isInteger(min_months) || min_months < 1 || min_months > 24) return 'Minimum stay must be 1–24 months.';
  const description = String(body.description ?? '').slice(0, 2000);
  const furnished = body.furnished === true;
  return { title, city, neighborhood, monthly_rent, monthly_dues, cleaning_fee, security_deposit, area_sqm, min_months, description, furnished };
}

/** POST /api/host/properties — create a new draft */
export async function POST(request: Request) {
  const db = await supabaseServer();
  if (!db) return json({ error: 'Service not configured.' }, 503);

  const { data: { user } } = await db.auth.getUser();
  if (!user) return json({ error: 'Authentication required.' }, 401);

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['host', 'admin'].includes(profile.role)) return json({ error: 'Host role required.' }, 403);

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid request.' }, 400); }

  const validated = validateFields(body);
  if (typeof validated === 'string') return json({ error: validated }, 400);

  const submitForReview = body.submitForReview === true;
  const status = submitForReview ? 'pending_review' : 'draft';

  const { data, error } = await db.from('properties').insert({
    host_id: user.id,
    ...validated,
    status,
    is_demo: false,
  }).select('id').single();

  if (error) return json({ error: 'Failed to save property.' }, 500);
  return json({ ok: true, id: data.id }, 201);
}

/** PATCH /api/host/properties — update an existing draft or rejected listing */
export async function PATCH(request: Request) {
  const db = await supabaseServer();
  if (!db) return json({ error: 'Service not configured.' }, 503);

  const { data: { user } } = await db.auth.getUser();
  if (!user) return json({ error: 'Authentication required.' }, 401);

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['host', 'admin'].includes(profile.role)) return json({ error: 'Host role required.' }, 403);

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid request.' }, 400); }

  const id = String(body.id ?? '');
  if (!id) return json({ error: 'Property ID is required.' }, 400);

  // Verify the property belongs to this host and is in an editable state.
  const { data: existing } = await db.from('properties').select('host_id,status').eq('id', id).single();
  if (!existing) return json({ error: 'Property not found.' }, 404);
  if (existing.host_id !== user.id && profile.role !== 'admin') return json({ error: 'Forbidden.' }, 403);
  if (!['draft', 'rejected'].includes(existing.status)) {
    return json({ error: `Cannot edit a ${existing.status} property.` }, 409);
  }

  const validated = validateFields(body);
  if (typeof validated === 'string') return json({ error: validated }, 400);

  const submitForReview = body.submitForReview === true;
  const newStatus = submitForReview ? 'pending_review' : 'draft';

  const { error } = await db.from('properties').update({
    ...validated,
    status: newStatus,
  }).eq('id', id);

  if (error) return json({ error: 'Failed to update property.' }, 500);
  return json({ ok: true });
}
