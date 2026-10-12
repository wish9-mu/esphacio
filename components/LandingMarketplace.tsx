'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Architecture from './Architecture';
import { filterListings, listings, money, type Listing } from '@/lib/domain';

const FILTERS = ['All stays', 'Short-term', 'Furnished', 'Under ₱25k', 'Saved'];

function Icon({ name }: { name: 'search' | 'calendar' | 'pin' | 'chevron' | 'home' }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    calendar: <><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M7 2.5v4M17 2.5v4M3 9h18" /></>,
    pin: <><path d="M20 10c0 5.5-8 11-8 11S4 15.5 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M10 20v-6h4v6" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function ListingCard({ listing: p, saved, ready, onToggle, compact = false }: {
  listing: Listing;
  saved: string[];
  ready: boolean;
  onToggle: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <article className={`listing-card${compact ? ' listing-card-compact' : ''}`}>
      <div className="listing-card-image">
        <Link href={`/properties/${p.id}`} aria-label={`View ${p.title}`}>
          <Architecture tone={p.tone} />
        </Link>
        <span className="badge">Demo listing</span>
        <button
          disabled={!ready}
          className={`save${saved.includes(p.id) ? ' saved' : ''}`}
          aria-label={(saved.includes(p.id) ? 'Unsave ' : 'Save ') + p.title}
          aria-pressed={saved.includes(p.id)}
          onClick={() => onToggle(p.id)}
        >
          {saved.includes(p.id) ? '♥' : '♡'}
        </button>
      </div>
      <div className="card-copy">
        <h3><Link href={`/properties/${p.id}`}>{p.title}</Link></h3>
        <p className="card-meta">{p.neighborhood}, {p.city} · {p.sqm} m² · {p.minMonths}+ mo min</p>
        <p className="card-price">{money(p.monthly)} <span>/ month</span></p>
        <p className="card-fees">{money(p.monthly + p.dues)} incl. dues · deposit {money(p.deposit)}</p>
      </div>
    </article>
  );
}

const PROPERTY_TYPES = [
  { title: 'Flexible monthly', description: 'Settle in for a month or more with clear, upfront costs.', filter: 'All stays', popular: true },
  { title: 'Short-term stays', description: 'Furnished spaces for shorter flexible living plans.', filter: 'Short-term' },
  { title: 'Furnished homes', description: 'Move-in-ready demo spaces across Metro Manila.', filter: 'Furnished' },
  { title: 'Under PHP 25k', description: 'Explore monthly rent and dues within a simple budget.', filter: 'Under ₱25k' },
  { title: 'Saved stays', description: 'Return to the spaces you kept on this device.', filter: 'Saved' },
];

export default function LandingMarketplace() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All stays');
  const [moveIn, setMoveIn] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedValue = JSON.parse(localStorage.getItem('esphacio-saved') || '[]');
      if (Array.isArray(savedValue)) setSaved(savedValue.filter(x => typeof x === 'string'));
      const recentValue = JSON.parse(localStorage.getItem('esphacio-recent') || '[]');
      if (Array.isArray(recentValue)) setRecent(recentValue.filter(x => typeof x === 'string'));
    } catch { /* local browser storage is optional */ }

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');
    const initialFilter = params.get('filter');
    if (initialQuery) setQuery(initialQuery);
    if (initialFilter && FILTERS.includes(initialFilter)) setFilter(initialFilter);
    setReady(true);
  }, []);

  function toggle(id: string) {
    const next = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
    setSaved(next);
    try { localStorage.setItem('esphacio-saved', JSON.stringify(next)); } catch { /* optional */ }
  }

  function applyFilter(nextFilter: string) {
    setFilter(nextFilter);
    const params = new URLSearchParams(window.location.search);
    if (nextFilter === 'All stays') params.delete('filter');
    else params.set('filter', nextFilter);
    const queryString = params.toString();
    window.history.replaceState({}, '', `/${queryString ? `?${queryString}` : ''}`);
    document.getElementById('stays')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const results = filterListings(query, filter, saved);
  const recentListings = recent.map(id => listings.find(p => p.id === id)).filter((p): p is Listing => Boolean(p));

  return (
    <main>
      <section className="landing-hero">
        <div className="shell landing-hero-inner">
          <div className="landing-hero-copy">
            <p className="eyebrow">With Esphacio</p>
            <h1><strong>Find Home</strong><span>For A While</span></h1>
            <p>Flexible furnished condos across Metro Manila, with the full monthly picture upfront.</p>
          </div>

          <form className="landing-search" onSubmit={e => {
            e.preventDefault();
            const params = new URLSearchParams();
            if (query.trim()) params.set('q', query.trim());
            if (moveIn) params.set('moveIn', moveIn);
            const queryString = params.toString();
            window.location.href = `/${queryString ? `?${queryString}` : ''}`;
          }}>
            <div className="landing-search-field landing-search-area">
              <Icon name="search" />
              <label htmlFor="search">Area, building, or unit</label>
              <input id="search" placeholder="Search by area, building, or unit name" value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" />
            </div>
            <div className="landing-search-field landing-search-date">
              <Icon name="calendar" />
              <label htmlFor="move-in">Move-in</label>
              <input id="move-in" type="month" value={moveIn} onChange={e => setMoveIn(e.target.value)} aria-label="Select move-in month" />
            </div>
            <button className="button landing-search-button" type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="shell landing-types" aria-labelledby="property-types-heading">
        <div className="landing-section-heading">
          <div><p className="eyebrow">Start with what fits</p><h2 id="property-types-heading">Find your kind of stay</h2></div>
          <Link href="#stays" className="text-link">Browse all stays <Icon name="chevron" /></Link>
        </div>
        <div className="property-type-grid">
          {PROPERTY_TYPES.map(type => (
            <Link key={type.title} href={`/?filter=${encodeURIComponent(type.filter)}`} className="property-type-card">
              {type.popular && <span className="type-pill">Popular</span>}
              <div className="property-type-top"><h3>{type.title}</h3><Icon name="chevron" /></div>
              <p>{type.description}</p>
              <span className="type-icon"><Icon name="home" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="map-cta" id="map">
        <Link href="/map" className="shell map-cta-link">
          <span className="map-cta-icon"><Icon name="pin" /></span>
          <span>Search homes anywhere <strong>on the map</strong></span>
          <Icon name="chevron" />
        </Link>
      </section>

      {recentListings.length > 0 && (
        <section className="shell recent-section" aria-labelledby="recent-heading">
          <div className="landing-section-heading compact-heading">
            <h2 id="recent-heading">Recently Viewed Units</h2>
            <Link href="#stays" className="text-link">View all <Icon name="chevron" /></Link>
          </div>
          <div className="recent-row">
            {recentListings.map(p => <ListingCard key={p.id} listing={p} saved={saved} ready={ready} onToggle={toggle} compact />)}
          </div>
        </section>
      )}

      <section id="stays" className="shell stays-section" aria-labelledby="stays-heading">
        <div className="stays-toolbar">
          <div className="filters" role="group" aria-label="Listing filters">
            {FILTERS.map(f => <button key={f} aria-pressed={filter === f} onClick={() => applyFilter(f)} className={filter === f ? 'active' : ''}>{f}</button>)}
          </div>
          <p className="demo-note">Fictional demo listings · prices illustrative · no verified availability</p>
        </div>
        <div className="section-head"><div><p className="eyebrow">A few places to begin</p><h2 id="stays-heading">{results.length} stay{results.length !== 1 ? 's' : ''} to explore</h2></div></div>
        <div className="listing-grid">
          {results.map(p => <ListingCard key={p.id} listing={p} saved={saved} ready={ready} onToggle={toggle} />)}
          {!results.length && <div className="empty-state"><div className="panel"><h3>No stays match.</h3><p className="muted">Try a different area or reset your filters.</p><button className="button" onClick={() => { setQuery(''); applyFilter('All stays'); }}>Reset search</button></div></div>}
        </div>
      </section>

      <section className="shell landing-host-cta">
        <div><p className="eyebrow">For property owners</p><h2>Make room for someone’s next chapter.</h2><p>Share your condo with a flexible renter. Every live listing goes through admin review first.</p></div>
        <Link className="button" href="/host">Become a host <span aria-hidden="true">→</span></Link>
      </section>

      <nav className="shell bottom-nav" aria-label="Mobile navigation">
        <Link href="#stays">⌂ Explore</Link><button onClick={() => applyFilter('Saved')}>♡ Saved</button><Link href="/account">♙ Account</Link>
      </nav>
    </main>
  );
}
