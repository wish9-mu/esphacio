'use client';

import { useState } from 'react';

export default function BecomeHostButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function becomeHost() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/host/access', { method: 'POST' });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? 'Unable to enable host access.');
        return;
      }
      window.location.href = '/host/dashboard';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="button" type="button" onClick={becomeHost} disabled={busy}>
        {busy ? 'Setting up host access…' : 'Become a host →'}
      </button>
      {error && <p className="auth-error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  );
}
