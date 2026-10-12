import { supabaseServer } from '@/lib/supabase';
import PropertyDraftEditor from '@/components/PropertyDraftEditor';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditProperty({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await supabaseServer();
  if (!db) return <main className="shell detail"><h1>Service unavailable</h1></main>;

  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    return (
      <main className="shell detail">
        <h1>Sign in required</h1>
        <Link className="button" href={`/account?next=/host/properties/${id}/edit`}>Sign in →</Link>
      </main>
    );
  }

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['host', 'admin'].includes(profile.role)) {
    return (
      <main className="shell detail">
        <h1>Host access required</h1>
        <Link className="button" href="/">Back to listings →</Link>
      </main>
    );
  }

  const { data: property, error } = await db
    .from('properties')
    .select('id,title,city,neighborhood,monthly_rent,monthly_dues,cleaning_fee,security_deposit,area_sqm,min_months,furnished,status,host_id')
    .eq('id', id)
    .single();

  if (error || !property) return notFound();

  // Only the owning host (or an admin) can edit; only draft/rejected properties.
  const isOwner = property.host_id === user.id || profile.role === 'admin';
  if (!isOwner) return notFound();
  if (!['draft', 'rejected'].includes(property.status)) {
    return (
      <main className="shell detail">
        <h1>Property cannot be edited</h1>
        <p>Only draft and rejected listings can be modified. This listing is <strong>{property.status}</strong>.</p>
        <Link className="button" href="/host/dashboard">← Back to dashboard</Link>
      </main>
    );
  }

  return (
    <main className="shell detail">
      <p className="eyebrow">HOST DASHBOARD</p>
      <h1>Edit listing draft</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Status: <strong>{property.status === 'rejected' ? 'Rejected — revise and resubmit' : 'Draft'}</strong>
      </p>
      <PropertyDraftEditor initial={{
        id: property.id,
        title: property.title,
        city: property.city,
        neighborhood: property.neighborhood,
        monthly_rent: Number(property.monthly_rent),
        monthly_dues: Number(property.monthly_dues),
        cleaning_fee: Number(property.cleaning_fee),
        security_deposit: Number(property.security_deposit),
        area_sqm: Number(property.area_sqm),
        min_months: property.min_months,
        furnished: property.furnished,
        status: property.status,
      }} />
    </main>
  );
}
