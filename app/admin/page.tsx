import { supabaseServer } from '@/lib/supabase';
import Link from 'next/link';
import AdminActions from '@/components/AdminActions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const db = await supabaseServer();

  if (!db) {
    return (
      <main className="shell detail">
        <p className="eyebrow">ADMIN FOUNDATION</p>
        <h1>A considered marketplace.</h1>
        <div className="panel">
          <h2>Workspace setup pending</h2>
          <p>Connect Supabase and provision an authorized account to manage live properties and inquiries.</p>
          <p>Listing drafts → review → publication. Demo listings remain separate from live inventory.</p>
          <p>This page provides no public access to private host or renter data.</p>
        </div>
      </main>
    );
  }

  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    return (
      <main className="shell detail">
        <h1>Sign-in required</h1>
        <Link className="button" href="/account?next=/admin">Sign in →</Link>
      </main>
    );
  }

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return (
      <main className="shell detail">
        <h1>Workspace access restricted</h1>
        <p>Your account does not have the required role.</p>
      </main>
    );
  }

  // Load pending_review + recently decided listings.
  const { data: pending, error: pendingErr } = await db
    .from('properties')
    .select('id,title,city,neighborhood,monthly_rent,area_sqm,min_months,furnished,status,created_at,host_id')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true });

  const { data: recent } = await db
    .from('properties')
    .select('id,title,status,city,neighborhood,created_at')
    .in('status', ['published', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <main className="shell detail">
      <p className="eyebrow">ADMIN</p>
      <h1>Listing review</h1>

      <section style={{ marginBottom: 40 }}>
        <h2>Pending review ({pending?.length ?? 0})</h2>
        {pendingErr && <p role="alert" style={{ color: '#b94a4a' }}>Unable to load queue.</p>}
        {!pending?.length && !pendingErr && <p className="muted">No listings awaiting review.</p>}
        {pending?.map(p => (
          <div key={p.id} className="panel" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>{p.title}</h3>
                <p className="muted" style={{ fontSize: 13, margin: '0 0 8px' }}>
                  {p.neighborhood}, {p.city} · {p.area_sqm} sqm · min {p.min_months}mo ·{' '}
                  {p.furnished ? 'Furnished' : 'Unfurnished'} ·{' '}
                  <strong style={{ color: 'var(--caramel)' }}>₱{Number(p.monthly_rent).toLocaleString('en-PH')}/mo</strong>
                </p>
                <p className="small muted" style={{ margin: 0 }}>Submitted {new Date(p.created_at).toLocaleDateString('en-PH')}</p>
              </div>
              <AdminActions propertyId={p.id} />
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>Recently decided</h2>
        {!recent?.length && <p className="muted">No recent decisions.</p>}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {recent?.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 18px',
              borderBottom: i < (recent.length - 1) ? '1px solid #e4ddce' : 'none',
              fontSize: 14,
            }}>
              <span>{p.title} — {p.neighborhood}, {p.city}</span>
              <span style={{
                color: p.status === 'published' ? '#4a7c59' : '#b94a4a',
                fontWeight: 700,
                fontSize: 12,
              }}>
                {p.status === 'published' ? '✓ Published' : '✗ Rejected'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
