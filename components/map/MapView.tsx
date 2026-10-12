'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';
import { money, type Listing } from '@/lib/domain';
import { themeColors } from '@/lib/theme';

const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const INITIAL_CENTER: [number, number] = [120.9842, 14.5995];

type Bounds = { north: number; south: number; east: number; west: number };

type MapViewProps = {
  listings: Listing[];
  selectedId: string | null;
  saved: string[];
  onSelect: (id: string | null) => void;
  onToggleSaved: (id: string) => void;
  onSearchArea: (bounds: Bounds) => void;
};

function geoJson(listings: Listing[]) {
  return {
    type: 'FeatureCollection' as const,
    features: listings.map(listing => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [listing.lng, listing.lat] },
      properties: {
        id: listing.id,
        title: listing.title,
        label: `${money(listing.monthly).replace(',000', 'k')}/mo`,
      },
    })),
  };
}

function boundsFromMap(map: MapLibreMap): Bounds {
  const bounds = map.getBounds();
  return { north: bounds.getNorth(), south: bounds.getSouth(), east: bounds.getEast(), west: bounds.getWest() };
}

export default function MapView({ listings, selectedId, saved, onSelect, onToggleSaved, onSearchArea }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const listingsRef = useRef(listings);
  const loadedRef = useRef(false);
  const initialMoveRef = useRef(true);
  const [loaded, setLoaded] = useState(false);
  const [moved, setMoved] = useState(false);
  const [error, setError] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number } | null>(null);

  listingsRef.current = listings;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_STYLE,
      center: INITIAL_CENTER,
      zoom: 11,
      attributionControl: { customAttribution: 'OpenFreeMap | OpenMapTiles | © OpenStreetMap contributors' },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const updatePopupPosition = () => {
      const current = listingsRef.current.find(listing => listing.id === selectedId);
      if (!current) { setPopupPosition(null); return; }
      const point = map.project([current.lng, current.lat]);
      setPopupPosition({ left: point.x, top: point.y });
    };

    const addListingLayers = () => {
      if (!map.getStyle() || map.getSource('esphacio-listings')) return;
      map.addSource('esphacio-listings', {
        type: 'geojson',
        data: geoJson(listingsRef.current),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 48,
      });
      map.addLayer({
        id: 'esphacio-clusters',
        type: 'circle',
        source: 'esphacio-listings',
        filter: ['has', 'point_count'],
        paint: { 'circle-color': themeColors.caramel, 'circle-radius': ['step', ['get', 'point_count'], 21, 5, 26, 10, 31], 'circle-stroke-color': themeColors.white, 'circle-stroke-width': 2 },
      });
      map.addLayer({
        id: 'esphacio-cluster-count',
        type: 'symbol',
        source: 'esphacio-listings',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 },
        paint: { 'text-color': themeColors.white },
      });
      map.addLayer({
        id: 'esphacio-pin-background',
        type: 'circle',
        source: 'esphacio-listings',
        filter: ['!', ['has', 'point_count']],
        paint: { 'circle-color': ['case', ['==', ['get', 'id'], selectedId || ''], themeColors.olive, themeColors.caramel], 'circle-radius': 23, 'circle-stroke-color': themeColors.white, 'circle-stroke-width': 2 },
      });
      map.addLayer({
        id: 'esphacio-pins',
        type: 'symbol',
        source: 'esphacio-listings',
        filter: ['!', ['has', 'point_count']],
        layout: { 'text-field': ['get', 'label'], 'text-size': 11, 'text-font': ['Noto Sans Bold'], 'text-allow-overlap': true },
        paint: { 'text-color': themeColors.white },
      });
      loadedRef.current = true;
      setLoaded(true);
      updatePopupPosition();
    };
    map.on('load', addListingLayers);
    const loadTimeout = window.setTimeout(() => { if (!loadedRef.current) setError(true); }, 15000);

    map.on('error', () => {
      if (!loaded) setError(true);
    });
    map.on('move', updatePopupPosition);
    map.on('moveend', () => {
      if (initialMoveRef.current) { initialMoveRef.current = false; return; }
      setMoved(true);
      updatePopupPosition();
    });
    map.on('click', 'esphacio-clusters', (event: maplibregl.MapLayerMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, { layers: ['esphacio-clusters'] });
      const clusterId = features[0]?.properties?.cluster_id;
      const source = map.getSource('esphacio-listings') as maplibregl.GeoJSONSource;
      if (clusterId !== undefined) source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
        const geometry = features[0].geometry as unknown as { coordinates: [number, number] };
        map.easeTo({ center: geometry.coordinates, zoom });
      });
    });
    map.on('click', 'esphacio-pin-background', (event: maplibregl.MapLayerMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, { layers: ['esphacio-pin-background'] })[0];
      onSelect(typeof feature?.properties?.id === 'string' ? feature.properties.id : null);
    });
    map.on('mouseenter', 'esphacio-clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseenter', 'esphacio-pin-background', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'esphacio-clusters', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseleave', 'esphacio-pin-background', () => { map.getCanvas().style.cursor = ''; });

    return () => { window.clearTimeout(loadTimeout); map.remove(); mapRef.current = null; };
    // The map instance is intentionally created once; filter data is updated below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getStyle()) return;
    const source = map.getSource('esphacio-listings') as maplibregl.GeoJSONSource | undefined;
    source?.setData(geoJson(listings));
  }, [listings]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getStyle()) return;
    map.setPaintProperty('esphacio-pin-background', 'circle-color', ['case', ['==', ['get', 'id'], selectedId || ''], themeColors.olive, themeColors.caramel]);
    const current = listings.find(listing => listing.id === selectedId);
    if (current) {
      const point = map.project([current.lng, current.lat]);
      setPopupPosition({ left: point.x, top: point.y });
    } else setPopupPosition(null);
  }, [listings, selectedId]);

  const selected = listings.find(listing => listing.id === selectedId);

  return (
    <div className="map-view">
      <div ref={containerRef} className="esphacio-map-canvas" aria-label="Map of Esphacio demo listings" />
      {!loaded && !error && <div className="map-status">Loading map…</div>}
      {error && <div className="map-status map-error"><strong>Map unavailable</strong><span>The listing list is still available.</span></div>}
      {moved && <button className="map-area-button" onClick={() => { const map = mapRef.current; if (map) { onSearchArea(boundsFromMap(map)); setMoved(false); } }}>Search this area</button>}
      {selected && popupPosition && (
        <div className="map-popup" style={{ left: popupPosition.left, top: popupPosition.top }} role="dialog" aria-label={`${selected.title} preview`}>
          <button className="map-popup-close" onClick={() => onSelect(null)} aria-label="Close listing preview">×</button>
          <span className="badge">Demo listing</span>
          <h3>{selected.title}</h3>
          <p>{selected.neighborhood}, {selected.city}</p>
          <strong>{money(selected.monthly)} <small>/ month</small></strong>
          <div className="map-popup-actions">
            <button className="popup-save" onClick={() => onToggleSaved(selected.id)} aria-label={`${saved.includes(selected.id) ? 'Unsave' : 'Save'} ${selected.title}`} aria-pressed={saved.includes(selected.id)}>{saved.includes(selected.id) ? '♥' : '♡'}</button>
            <Link href={`/properties/${selected.id}`} className="button">View</Link>
          </div>
        </div>
      )}
      <div className="map-attribution-note">OpenFreeMap · OpenMapTiles · © OpenStreetMap contributors</div>
    </div>
  );
}
