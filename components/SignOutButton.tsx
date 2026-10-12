'use client';
import { useState } from 'react';

export default function SignOutButton() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      window.location.href = '/';
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      id="sign-out-btn"
      onClick={signOut}
      disabled={busy}
      style={{
        background: 'transparent',
        border: '1px solid var(--caramel)',
        color: 'var(--caramel)',
        borderRadius: 28,
        padding: '12px 22px',
        fontWeight: 700,
        cursor: busy ? 'wait' : 'pointer',
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
