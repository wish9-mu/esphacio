'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Architecture from '@/components/Architecture';
import { filterListings, listings, money, type Listing } from '@/lib/domain';

type Bounds = { north: number; south: number; east: number; west: number };

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="map-loading-skeleton" aria-label="Loading map" />,
});

const MAP_FILTERS = ['All stays', 'Under ₱25k', 'Furnished', 'Short-term', 'Saved'];

function inBounds(listing: Listing, bounds: Bounds | null) {
  if (!bounds) return true;
  return listing.lat >= bounds.south && listing.lat <= bounds.north && listing.lng >= bounds.west && listing.lng <= bounds.east;
}

function ListingRow({ listing, selected, saved, onSelect, onToggleSaved }: {
  listing: Listing;
  selected: boolean;
  saved: boolean;
  onSelect: () => void;
  onToggleSaved: () => void;
}) {
  return (
    <article className={`map-listing-row${selected ? ' selected' : ''}`} onMouseEnter={onSelect} onFocus={onSelect}>
      <Link href={`/properties/${listing.id}`} className="map-listing-image" onClick={onSelect} aria-label={`View ${listing.title}`}>
        <Architecture tone={listing.tone} />
        <span className="badge">Demo listing</span>
      </Link>
      <div className="map-listing-copy">
        <div className="map-listing-title"><h2><Link href={`/properties/${listing.id}`}>{listing.title}</Link></h2><button className={`map-save${saved ? ' saved' : ''}`} onClick={onToggleSaved} aria-label={`${saved ? 'Unsave' : 'Save'} ${listing.title}`} aria-pressed={saved}>{saved ? '♥' : '♡'}</button></div>
        <p>{listing.neighborhood}, {listing.city}</p>
        <strong>{money(listing.monthly)} <small>/ month</small></strong>
        <span>{money(listing.monthly + listing.dues)} incl. dues · {listing.sqm} m²</span>
      </div>
    </article>
  );
}

export default function MapSearch() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All stays');
  const [moveIn, setMoveIn] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('esphacio-saved') || '[]');
      if (Array.isArray(stored)) setSaved(stored.filter(value => typeof value === 'string'));
    } catch { /* local browser storage is optional */ }
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') || '');
    setMoveIn(params.get('moveIn') || '');
    setFilter(MAP_FILTERS.includes(params.get('filter') || '') ? params.get('filter') || 'All stays' : 'All stays');
    setReady(true);
  }, []);

  const filteredListings = useMemo(() => filterListings(query, filter, saved).filter(listing => inBounds(listing, bounds)), [query, filter, saved, bounds]);

  function updateUrl(nextQuery = query, nextFilter = filter, nextMoveIn = moveIn) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set('q', nextQuery.trim());
    if (nextMoveIn) params.set('moveIn', nextMoveIn);
    if (nextFilter !== 'All stays') params.set('filter', nextFilter);
    const queryString = params.toString();
    window.history.replaceState({}, '', `/map${queryString ? `?${queryString}` : ''}`);
  }

  function setFilterAndUrl(nextFilter: string) {
    setFilter(nextFilter);
    setBounds(null);
    updateUrl(query, nextFilter, moveIn);
  }

  function toggleSaved(id: string) {
    const next = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
    setSaved(next);
    try { localStorage.setItem('esphacio-saved', JSON.stringify(next)); } catch { /* optional */ }
  }

  return (
    <main className="map-page">
      <form className="map-filter-bar" onSubmit={event => { event.preventDefault(); updateUrl(); }}>
        <label className="map-search-control"><span aria-hidden="true">⌕</span><span className="sr-only">Search listings</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search area, building, or unit" /></label>
        <label className="map-filter-control"><span>Dates</span><input type="month" value={moveIn} onChange={event => { setMoveIn(event.target.value); updateUrl(query, filter, event.target.value); }} aria-label="Move-in month" /></label>
        <button type="button" className={filter === 'Under ₱25k' ? 'active' : ''} onClick={() => setFilterAndUrl(filter === 'Under ₱25k' ? 'All stays' : 'Under ₱25k')}>Price</button>
        <button type="button" className={filter === 'Furnished' ? 'active' : ''} onClick={() => setFilterAndUrl(filter === 'Furnished' ? 'All stays' : 'Furnished')}>Furnished</button>
        <button type="button" className={filter === 'Short-term' ? 'active' : ''} onClick={() => setFilterAndUrl(filter === 'Short-term' ? 'All stays' : 'Short-term')}>Short-term</button>
        <button type="button" className={filter === 'Saved' ? 'active' : ''} onClick={() => setFilterAndUrl(filter === 'Saved' ? 'All stays' : 'Saved')}>Saved</button>
        <button type="button" className="map-reset" onClick={() => { setQuery(''); setMoveIn(''); setFilter('All stays'); setBounds(null); updateUrl('', 'All stays', ''); }}>Reset</button>
      </form>

      <div className="map-mobile-toggle" role="group" aria-label="Map or list view">
        <button className={mobileView === 'map' ? 'active' : ''} onClick={() => setMobileView('map')}>Map</button>
        <button className={mobileView === 'list' ? 'active' : ''} onClick={() => setMobileView('list')}>List ({filteredListings.length})</button>
      </div>

      <div className={`map-split-view ${mobileView}`}>
        <aside className="map-list-panel" aria-label="Listing results">
          <div className="map-list-heading"><div><p className="eyebrow">Metro Manila · Demo inventory</p><h1>{filteredListings.length} stay{filteredListings.length !== 1 ? 's' : ''} nearby</h1></div><span>{ready ? 'Saved locally' : ''}</span></div>
          <p className="map-demo-note">Fictional listings · prices illustrative · no verified availability</p>
          <div className="map-list-scroll">
            {filteredListings.map(listing => <ListingRow key={listing.id} listing={listing} selected={selectedId === listing.id} saved={saved.includes(listing.id)} onSelect={() => setSelectedId(listing.id)} onToggleSaved={() => toggleSaved(listing.id)} />)}
            {!filteredListings.length && <div className="panel"><h2>No stays in this view</h2><p className="muted">Reset filters or search another neighborhood.</p><button className="button" onClick={() => { setQuery(''); setFilter('All stays'); setBounds(null); updateUrl('', 'All stays', ''); }}>Reset search</button></div>}
          </div>
        </aside>
        <section className="map-panel" aria-label="Map view">
          <MapView listings={filteredListings} selectedId={selectedId} saved={saved} onSelect={setSelectedId} onToggleSaved={toggleSaved} onSearchArea={setBounds} />
        </section>
      </div>
    </main>
  );
}
