'use client';
import { useState, FormEvent } from 'react';

type Mode = 'login' | 'signup';

export default function AuthForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>('login');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    const f = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      email: String(f.get('email') ?? ''),
      password: String(f.get('password') ?? ''),
    };
    if (mode === 'signup') body.displayName = String(f.get('displayName') ?? '');

    try {
      const res = await fetch(`/api/auth/${mode === 'login' ? 'signin' : 'signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? 'Something went wrong.');
        return;
      }
      if (data.confirmEmail) {
        setStatus('Check your email and click the confirmation link, then come back to sign in.');
        setDone(true);
        return;
      }
      // Reload to pick up the new session cookie.
      window.location.href = next ?? '/account';
    } catch {
      setStatus('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '36px' }}>
        <p style={{ fontSize: 22, marginBottom: 12 }}>📬 Check your inbox</p>
        <p>{status}</p>
        <button className="button" style={{ marginTop: 16 }} onClick={() => { setDone(false); setStatus(''); setMode('login'); }}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="panel auth-panel">
      <div className="auth-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'login'}
          className={mode === 'login' ? 'active' : ''}
          onClick={() => { setMode('login'); setStatus(''); }}
        >
          Sign in
        </button>
        <button
          role="tab"
          aria-selected={mode === 'signup'}
          className={mode === 'signup' ? 'active' : ''}
          onClick={() => { setMode('signup'); setStatus(''); }}
        >
          Create account
        </button>
      </div>

      <form onSubmit={submit} autoComplete="on">
        {mode === 'signup' && (
          <label>
            Display name
            <input name="displayName" type="text" maxLength={80} autoComplete="name" placeholder="How hosts will see you" />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={mode === 'signup' ? 8 : 1}
            maxLength={128}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder={mode === 'signup' ? 'At least 8 characters' : ''}
          />
        </label>
        {status && <p role="alert" className="auth-error">{status}</p>}
        <button className="button" disabled={busy} style={{ width: '100%', marginTop: 8 }}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Create account →'}
        </button>
      </form>

      <p className="small" style={{ marginTop: 16, textAlign: 'center' }}>
        {mode === 'login'
          ? <>No account? <button className="link-btn" onClick={() => { setMode('signup'); setStatus(''); }}>Create one free</button></>
          : <>Already have one? <button className="link-btn" onClick={() => { setMode('login'); setStatus(''); }}>Sign in</button></>
        }
      </p>
    </div>
  );
}
