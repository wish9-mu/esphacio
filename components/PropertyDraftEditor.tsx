'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface PropertyFormProps {
  /** Existing values when editing a draft/rejected property. */
  initial?: {
    id: string;
    title: string;
    city: string;
    neighborhood: string;
    monthly_rent: number;
    monthly_dues: number;
    cleaning_fee: number;
    security_deposit: number;
    area_sqm: number;
    min_months: number;
    furnished: boolean;
    description?: string;
    status: string;
  };
}

export default function PropertyDraftEditor({ initial }: PropertyFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>, submitForReview = false) {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    const f = new FormData(e.currentTarget);

    const payload = {
      id: initial?.id,
      title: String(f.get('title') ?? ''),
      city: String(f.get('city') ?? ''),
      neighborhood: String(f.get('neighborhood') ?? ''),
      monthly_rent: Number(f.get('monthly_rent')),
      monthly_dues: Number(f.get('monthly_dues') ?? 0),
      cleaning_fee: Number(f.get('cleaning_fee') ?? 0),
      security_deposit: Number(f.get('security_deposit') ?? 0),
      area_sqm: Number(f.get('area_sqm')),
      min_months: Number(f.get('min_months') ?? 1),
      furnished: f.get('furnished') === 'on',
      description: String(f.get('description') ?? ''),
      submitForReview,
    };

    try {
      const res = await fetch('/api/host/properties', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? 'Something went wrong.');
        setBusy(false);
        return;
      }
      router.push('/host/dashboard');
    } catch {
      setStatus('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => submit(e, false)}
      style={{ maxWidth: 640 }}
    >
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Property details</h2>

        <label>
          Listing title
          <input name="title" required minLength={3} maxLength={120} defaultValue={initial?.title} placeholder="e.g. Sunlit studio in BGC" />
        </label>
        <label>
          Description
          <textarea name="description" maxLength={2000} defaultValue={initial?.description} placeholder="Describe the space, amenities and neighbourhood vibe (optional for draft)." />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <label>
            City
            <input name="city" required maxLength={80} defaultValue={initial?.city} placeholder="Taguig City" />
          </label>
          <label>
            Neighbourhood
            <input name="neighborhood" required maxLength={80} defaultValue={initial?.neighborhood} placeholder="BGC" />
          </label>
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Pricing (₱)</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <label>
            Monthly rent *
            <input name="monthly_rent" type="number" required min={1} step={0.01} defaultValue={initial?.monthly_rent} />
          </label>
          <label>
            Monthly dues / HOA
            <input name="monthly_dues" type="number" min={0} step={0.01} defaultValue={initial?.monthly_dues ?? 0} />
          </label>
          <label>
            One-time cleaning fee
            <input name="cleaning_fee" type="number" min={0} step={0.01} defaultValue={initial?.cleaning_fee ?? 0} />
          </label>
          <label>
            Refundable security deposit
            <input name="security_deposit" type="number" min={0} step={0.01} defaultValue={initial?.security_deposit ?? 0} />
          </label>
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Unit details</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <label>
            Area (sqm) *
            <input name="area_sqm" type="number" required min={1} step={0.1} defaultValue={initial?.area_sqm} />
          </label>
          <label>
            Minimum stay (months) *
            <input name="min_months" type="number" required min={1} max={24} defaultValue={initial?.min_months ?? 1} />
          </label>
        </div>

        <label className="check" style={{ marginTop: 16 }}>
          <input name="furnished" type="checkbox" defaultChecked={initial?.furnished ?? true} />
          Unit is furnished
        </label>
      </div>

      {status && <p role="alert" className="auth-error">{status}</p>}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        <button
          type="submit"
          className="button"
          disabled={busy}
          style={{ background: 'var(--olive)' }}
        >
          {busy ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          className="button"
          disabled={busy}
          onClick={(e) => {
            const form = (e.currentTarget as HTMLButtonElement).closest('form') as HTMLFormElement;
            const syntheticEvent = { preventDefault: () => {}, currentTarget: form } as unknown as FormEvent<HTMLFormElement>;
            submit(syntheticEvent, true);
          }}
        >
          {busy ? 'Submitting…' : 'Submit for review →'}
        </button>
        <a href="/host/dashboard" style={{ alignSelf: 'center', color: 'var(--caramel)', fontWeight: 600 }}>
          Cancel
        </a>
      </div>
      <p className="small muted" style={{ marginTop: 16 }}>
        Saving keeps the draft private. "Submit for review" moves it to <em>pending review</em> for admin approval before it appears in the public catalogue.
      </p>
    </form>
  );
}
