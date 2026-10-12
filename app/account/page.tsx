import { supabaseServer } from '@/lib/supabase';
import SignInForm from '@/components/SignInForm';
import SignOutButton from '@/components/SignOutButton';
import BecomeHostButton from '@/components/BecomeHostButton';
import type { SearchParams } from 'next/dist/server/request/search-params';

export default async function Account({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const requestedNext = typeof params.next === 'string' ? params.next : undefined;
  const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : undefined;
  const authError = typeof params.error === 'string' ? params.error : undefined;

  const db = await supabaseServer();
  if (!db) {
    return (
      <main className="shell detail">
        <p className="eyebrow">YOUR ESPHACIO</p>
        <h1>A little space for your plans.</h1>
        <div className="panel">
          <h2>Account foundation</h2>
          <p>Browsing, saving stays on this device and simulated inquiries are available without an account.</p>
          <p>Live sign-in and host onboarding require Supabase setup and are not enabled in this MVP. Saved stays remain in this browser and do not sync between devices.</p>
          <a className="button" href="/">Explore demo stays →</a>
        </div>
      </main>
    );
  }

  const { data: { user } } = await db.auth.getUser();

  if (user) {
    const { data: profile } = await db.from('profiles').select('display_name,role').eq('id', user.id).single();
    const role = profile?.role ?? 'renter';
    const name = profile?.display_name || user.email;

    return (
      <main className="shell detail">
        <p className="eyebrow">YOUR ESPHACIO</p>
        <h1>Welcome back{name ? `, ${name}` : ''}.</h1>
        <div className="panel">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {role}</p>
          {role === 'host' || role === 'admin' ? (
            <a className="button" href="/host/dashboard" style={{ marginRight: 12 }}>
              Host dashboard →
            </a>
          ) : null}
          {role === 'admin' ? (
            <a className="button" href="/admin" style={{ marginRight: 12 }}>
              Admin →
            </a>
          ) : null}
          {role === 'renter' ? (
            <div className="host-onboarding">
              <h2>Have a space to share?</h2>
              <p>Enable host access to create listing drafts. This does not verify your identity or property, and every listing still needs admin approval.</p>
              <BecomeHostButton />
            </div>
          ) : null}
          <a className="button" href="/" style={{ marginRight: 12 }}>Explore stays →</a>
          <SignOutButton />
        </div>
      </main>
    );
  }

  return (
    <main className="shell detail">
      <p className="eyebrow">YOUR ESPHACIO</p>
      <h1>A little space for your plans.</h1>
      {authError === 'auth_callback' && (
        <p role="alert" className="auth-error" style={{ marginBottom: 16 }}>
          Email confirmation failed or expired. Please try again.
        </p>
      )}
      <SignInForm next={next} />
      <p className="small muted" style={{ marginTop: 20 }}>
        Browsing and saving stays work without an account. Demo properties only — no bookings or payments.
      </p>
    </main>
  );
}
