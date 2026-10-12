import { supabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

function json(body: object, status = 200) {
  return NextResponse.json(body, { status });
}

/**
 * POST /api/admin/properties/moderate
 * Body: { propertyId: string, action: 'approve' | 'reject' }
 *
 * Only admins (role verified from the database, not user metadata) may call this.
 * Approve: pending_review → published.
 * Reject:  pending_review → rejected (host may revise and resubmit).
 */
export async function POST(request: Request) {
  const db = await supabaseServer();
  if (!db) return json({ error: 'Service not configured.' }, 503);

  const { data: { user } } = await db.auth.getUser();
  if (!user) return json({ error: 'Authentication required.' }, 401);

  // Role must come from the database — never from user-supplied JWT claims.
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return json({ error: 'Admin role required.' }, 403);

  let body: { propertyId?: string; action?: string };
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid request.' }, 400); }

  const { propertyId, action } = body;
  if (!propertyId || typeof propertyId !== 'string') return json({ error: 'propertyId is required.' }, 400);
  if (action !== 'approve' && action !== 'reject') return json({ error: 'action must be "approve" or "reject".' }, 400);

  // Verify the property is actually in pending_review before mutating.
  const { data: property } = await db.from('properties').select('status,is_demo').eq('id', propertyId).single();
  if (!property) return json({ error: 'Property not found.' }, 404);
  if (property.is_demo) return json({ error: 'Demo listings cannot be moderated.' }, 409);
  if (property.status !== 'pending_review') {
    return json({ error: `Property is ${property.status}, not pending_review.` }, 409);
  }

  const newStatus = action === 'approve' ? 'published' : 'rejected';
  const { error } = await db.from('properties').update({ status: newStatus }).eq('id', propertyId);
  if (error) return json({ error: 'Failed to update property status.' }, 500);

  return json({ ok: true, status: newStatus });
}
