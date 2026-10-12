import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase';
import BecomeHostButton from '@/components/BecomeHostButton';

export const dynamic = 'force-dynamic';

export default async function HostLanding() {
	const db = await supabaseServer();
	const user = db ? (await db.auth.getUser()).data.user : null;
	const profile = user && db
		? (await db.from('profiles').select('role').eq('id', user.id).single()).data
		: null;

	return (
		<main className="shell detail host-landing">
			<p className="eyebrow">FOR PROPERTY OWNERS</p>
			<h1>Make room for someone&apos;s next chapter.</h1>
			<p className="intro">List your condo for flexible stays, create drafts at your own pace, and keep control of the details.</p>

			<div className="host-landing-grid">
				<section className="panel">
					<h2>How host access works</h2>
					<ol className="host-steps">
						<li><strong>Enable host access.</strong> Your renter account gains access to listing drafts.</li>
						<li><strong>Create your listing.</strong> Add costs, location, stay length, and furnishing details.</li>
						<li><strong>Submit for review.</strong> An admin must approve a listing before it becomes public.</li>
					</ol>
					<p className="small muted">Host access is not identity verification, property verification, or a guarantee of availability. Esphacio does not process bookings or payments in this demo.</p>
				</section>

				<section className="panel host-action-panel">
					{!db ? (
						<>
							<h2>Host onboarding is being prepared</h2>
							<p>Connect Supabase to enable secure host access. Demo browsing remains available.</p>
							<Link className="button" href="/account">Open your account →</Link>
						</>
					) : !user ? (
						<>
							<h2>Ready to share your space?</h2>
							<p>Sign in or create an account first. New accounts begin as renters, then can enable host access securely.</p>
							<Link className="button" href="/account?next=/host">Sign in to become a host →</Link>
						</>
					) : profile?.role === 'renter' ? (
						<>
							<h2>Become a host</h2>
							<p>Enable host access now. You can still browse, save stays, and use renter features afterward.</p>
							<BecomeHostButton />
						</>
					) : (
						<>
							<h2>Your host workspace</h2>
							<p>{profile?.role === 'admin' ? 'Review listings or open the host workspace.' : 'Create and manage your listing drafts.'}</p>
							<Link className="button" href={profile?.role === 'admin' ? '/admin' : '/host/dashboard'}>
								{profile?.role === 'admin' ? 'Open admin review →' : 'Open host dashboard →'}
							</Link>
						</>
					)}
				</section>
			</div>
		</main>
	);
}
