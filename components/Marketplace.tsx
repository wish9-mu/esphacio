'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Architecture from './Architecture';
import { filterListings, money } from '@/lib/domain';

const FILTERS = ['All stays', 'Short-term', 'Furnished', 'Under ₱25k', 'Saved'];

export default function Marketplace() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All stays');
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem('esphacio-saved') || '[]');
      if (Array.isArray(v)) setSaved(v.filter(x => typeof x === 'string'));
    } catch { /* */ }
    setReady(true);
  }, []);

  function toggle(id: string) {
    const next = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
    setSaved(next);
    try { localStorage.setItem('esphacio-saved', JSON.stringify(next)); } catch { /* */ }
  }

  const results = filterListings(query, filter, saved);

  return (
    <main>
      {/* ── Hero ── */}
      <section className="shell hero">
        <p className="eyebrow">Condo rental discovery · Metro Manila</p>
        <h1 className="desktop-copy">Find your space.<br />Stay your way.</h1>
        <h1 className="mobile-copy">Find your space.<br />Stay your way.</h1>
        <p className="hero-sub">
          Furnished condos across BGC, Makati and Ortigas.
          Clear costs, flexible stays, no guesswork.
        </p>

        {/* Search bar */}
        <form
          className="search-bar"
          onSubmit={e => {
            e.preventDefault();
            document.getElementById('stays')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <label className="sr-only" htmlFor="search">City or neighborhood</label>
          <span style={{ fontSize: 18, color: '#bbb', flexShrink: 0 }}>⌕</span>
          <input
            id="search"
            placeholder="City or neighborhood…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button id="explore-btn" className="button" type="submit">Search</button>
        </form>

        <p className="trust">
          Clear cost breakdowns &nbsp;·&nbsp; Flexible stays &nbsp;·&nbsp;
          <strong style={{ color: '#c0844a' }}>Demo listings only</strong>
        </p>
      </section>

      {/* ── Listings ── */}
      <section id="stays" className="shell" style={{ paddingBottom: 64 }}>
        {/* Filters */}
        <div className="filters-wrap">
          <div className="filters" role="group" aria-label="Listing filters">
            {FILTERS.map(f => (
              <button
                key={f}
                id={`filter-${f.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={filter === f ? 'active' : ''}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="section-head">
          <h2>
            {results.length} {filter === 'All stays' ? 'demo' : ''} stay{results.length !== 1 ? 's' : ''} found
          </h2>
          <span className="demo-note">Fictional demo listings · prices illustrative · no verified availability</span>
        </div>

        <div className="grid">
          {results.map(p => (
            <article className="card" key={p.id}>
              <div className="card-image">
                <Link href={`/properties/${p.id}`} aria-label={`View ${p.title}`}>
                  <Architecture tone={p.tone} />
                </Link>
                <span className="badge">Demo listing</span>
                <button
                  disabled={!ready}
                  className={`save${saved.includes(p.id) ? ' saved' : ''}`}
                  aria-label={(saved.includes(p.id) ? 'Unsave ' : 'Save ') + p.title}
                  aria-pressed={saved.includes(p.id)}
                  onClick={() => toggle(p.id)}
                >
                  {saved.includes(p.id) ? '♥' : '♡'}
                </button>
              </div>

              <div className="card-copy">
                <h3><Link href={`/properties/${p.id}`}>{p.title}</Link></h3>
                <p className="card-meta">
                  {p.neighborhood}, {p.city}
                  &nbsp;·&nbsp; {p.sqm} m²
                  &nbsp;·&nbsp; {p.minMonths}+ mo min
                  &nbsp;·&nbsp; {p.furnished ? 'Furnished' : 'Unfurnished'}
                </p>
                <p className="card-price">
                  {money(p.monthly)} <span>/ month</span>
                </p>
                <p className="card-fees">
                  {money(p.monthly + p.dues)} incl. dues · deposit {money(p.deposit)}
                </p>
              </div>
            </article>
          ))}

          {!results.length && (
            <div className="empty-state">
              <div className="panel">
                <h3>No stays match.</h3>
                <p className="muted">Try a different city, neighbourhood or reset your filters.</p>
                <button className="button" onClick={() => { setQuery(''); setFilter('All stays'); }}>
                  Reset search
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="how shell">
        <p className="eyebrow">Simple by design</p>
        <h2>How it works</h2>
        <div className="how-grid">
          {[
            ['01', 'Find your space', 'Search by city, neighbourhood, budget and stay length. Filter for furnished units or short-term availability.'],
            ['02', 'Review full costs', 'See rent, condo dues, one-time cleaning fee and the refundable deposit — all upfront, no hidden surprises.'],
            ['03', 'Start a conversation', 'Send a simulated inquiry (demo only). In a live version, the host responds directly to confirm terms and availability.'],
          ].map(([n, title, desc]) => (
            <div className="how-step" key={n}>
              <div className="how-num">{n}</div>
              <h3>{title}</h3>
              <p className="muted" style={{ fontSize: 14 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── List your property CTA ── */}
      <div className="shell" style={{ paddingBottom: 0 }}>
        <div className="list-cta">
          <div>
            <h2>List your property</h2>
            <p>Join the waitlist for host access. Publish your condo and manage inquiries — with admin review before anything goes live.</p>
          </div>
          <a className="button" href="/host">Learn more →</a>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="shell bottom-nav" aria-label="Mobile navigation">
        <a href="#stays" onClick={() => setFilter('All stays')}>⌂ Explore</a>
        <button onClick={() => { setFilter('Saved'); document.getElementById('stays')?.scrollIntoView({ behavior: 'smooth' }); }}>
          ♡ Saved
        </button>
        <Link href="/account">♙ Account</Link>
      </nav>
    </main>
  );
}
