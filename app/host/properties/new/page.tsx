import { supabaseServer } from '@/lib/supabase';
import PropertyDraftEditor from '@/components/PropertyDraftEditor';
import Link from 'next/link';

export default async function NewProperty() {
  const db = await supabaseServer();
  if (!db) return <main className="shell detail"><h1>Service unavailable</h1></main>;

  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    return (
      <main className="shell detail">
        <h1>Sign in required</h1>
        <Link className="button" href="/account?next=/host/properties/new">Sign in →</Link>
      </main>
    );
  }

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['host', 'admin'].includes(profile.role)) {
    return (
      <main className="shell detail">
        <h1>Host access required</h1>
        <p>Contact an administrator to have your account upgraded to host.</p>
        <Link className="button" href="/">Back to listings →</Link>
      </main>
    );
  }

  return (
    <main className="shell detail">
      <p className="eyebrow">HOST DASHBOARD</p>
      <h1>New property listing</h1>
      <PropertyDraftEditor />
    </main>
  );
}
