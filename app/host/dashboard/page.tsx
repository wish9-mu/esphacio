import { supabaseServer } from '@/lib/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function requireHost(db: Awaited<ReturnType<typeof supabaseServer>>) {
  if (!db) return { redirect: 'unconfigured' as const };
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { redirect: 'unauthenticated' as const };
  const { data: profile } = await db.from('profiles').select('role,display_name').eq('id', user.id).single();
  if (!profile || !['host', 'admin'].includes(profile.role)) return { redirect: 'forbidden' as const };
  return { user, profile };
}

export default async function HostDashboard() {
  const db = await supabaseServer();
  const check = await requireHost(db);

  if ('redirect' in check) {
    if (check.redirect === 'unconfigured') {
      return (
        <main className="shell detail">
          <p className="eyebrow">HOST FOUNDATION</p>
          <h1>Make room for someone's next chapter.</h1>
          <div className="panel">
            <h2>Workspace setup pending</h2>
            <p>Connect Supabase and provision an authorized host account to manage live properties and inquiries.</p>
            <p>Listing drafts → review → publication. Demo listings remain separate from live inventory.</p>
            <p>This page provides no public access to private host or renter data.</p>
          </div>
        </main>
      );
    }
    if (check.redirect === 'unauthenticated') {
      return (
        <main className="shell detail">
          <h1>Sign in required</h1>
          <p>Please <Link className="button" href="/account?next=/host/dashboard">sign in</Link> to access your host dashboard.</p>
        </main>
      );
    }
    return (
      <main className="shell detail">
        <h1>Access restricted</h1>
        <p>Your account does not have host permissions. Contact an administrator to request host access.</p>
        <Link className="button" href="/">Back to listings →</Link>
      </main>
    );
  }

  const { data: properties, error } = await db!
    .from('properties')
    .select('id,title,status,city,neighborhood,monthly_rent,created_at')
    .order('created_at', { ascending: false });

  const statusLabel: Record<string, string> = {
    draft: 'Draft',
    pending_review: 'Pending review',
    published: 'Published',
    rejected: 'Rejected',
  };
  const statusColor: Record<string, string> = {
    draft: '#777768',
    pending_review: '#AD7D49',
    published: '#4a7c59',
    rejected: '#b94a4a',
  };

  return (
    <main className="shell detail">
      <p className="eyebrow">HOST DASHBOARD</p>
      <h1>Your properties</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p className="muted" style={{ margin: 0 }}>
          Drafts must be submitted for admin review before appearing in the public catalogue.
        </p>
        <Link className="button" href="/host/properties/new">+ New property</Link>
      </div>

      {error && <p role="alert" style={{ color: '#b94a4a' }}>Unable to load properties. Check database setup.</p>}

      {!error && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {!properties?.length ? (
            <p style={{ padding: 24 }}>No property drafts yet. Create your first listing above.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e4ddce', background: '#f9f6ef' }}>
                  <th style={{ textAlign: 'left', padding: '12px 18px' }}>Property</th>
                  <th style={{ textAlign: 'left', padding: '12px 18px' }}>Location</th>
                  <th style={{ textAlign: 'right', padding: '12px 18px' }}>Monthly</th>
                  <th style={{ textAlign: 'center', padding: '12px 18px' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '12px 18px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < properties.length - 1 ? '1px solid #e4ddce' : 'none' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 600 }}>{p.title}</td>
                    <td style={{ padding: '12px 18px', color: '#777768' }}>{p.neighborhood}, {p.city}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--caramel)', fontWeight: 700 }}>
                      ₱{Number(p.monthly_rent).toLocaleString('en-PH')}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <span style={{
                        background: `${statusColor[p.status] ?? '#777'}22`,
                        color: statusColor[p.status] ?? '#777',
                        borderRadius: 20,
                        padding: '4px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                      }}>
                        {statusLabel[p.status] ?? p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      {['draft', 'rejected'].includes(p.status) && (
                        <Link href={`/host/properties/${p.id}/edit`} style={{ color: 'var(--caramel)', fontWeight: 600, fontSize: 13 }}>
                          Edit
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <p className="small muted" style={{ marginTop: 24 }}>
        Published listings cannot be edited directly. Submit changes from a rejected draft or contact an admin.
      </p>
    </main>
  );
}
