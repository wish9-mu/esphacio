'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function SignInForm({ next }: { next?: string }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(form.get('email') ?? ''), password: String(form.get('password') ?? '') }),
      });
      const body = await response.json();
      if (!response.ok) { setStatus(body.error ?? 'Unable to sign in.'); return; }
      window.location.href = next ?? '/account';
    } catch {
      setStatus('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel auth-panel">
      <form onSubmit={submit} autoComplete="on">
        <label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
        <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
        {status && <p role="alert" className="auth-error">{status}</p>}
        <button className="button" disabled={busy} style={{ width: '100%', marginTop: 8 }}>
          {busy ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
      <p className="small" style={{ marginTop: 16, textAlign: 'center' }}>
        New to Esphacio? <Link className="link-btn" href="/signup?role=tenant">Create a Tenant account</Link>
      </p>
      <p className="small" style={{ marginTop: 8, textAlign: 'center' }}>
        Listing a property? <Link className="link-btn" href="/signup?role=landlord">Create a Landlord account</Link>
      </p>
    </div>
  );
}
