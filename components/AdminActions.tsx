'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminActions({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState('');

  async function act(action: 'approve' | 'reject') {
    setBusy(action);
    setError('');
    try {
      const res = await fetch('/api/admin/properties/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, action }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Action failed.'); setBusy(null); return; }
      router.refresh();
    } catch {
      setError('Network error.');
      setBusy(null);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      {error && <span role="alert" style={{ color: '#b94a4a', fontSize: 12 }}>{error}</span>}
      <button
        id={`approve-${propertyId}`}
        className="button"
        disabled={busy !== null}
        onClick={() => act('approve')}
        style={{ background: '#4a7c59', fontSize: 13, padding: '8px 18px' }}
      >
        {busy === 'approve' ? 'Publishing…' : '✓ Approve'}
      </button>
      <button
        id={`reject-${propertyId}`}
        className="button"
        disabled={busy !== null}
        onClick={() => act('reject')}
        style={{ background: '#b94a4a', fontSize: 13, padding: '8px 18px' }}
      >
        {busy === 'reject' ? 'Rejecting…' : '✗ Reject'}
      </button>
    </div>
  );
}
