'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GeoJSON, MapContainer, Popup, TileLayer, CircleMarker, ScaleControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { ParcelRecord } from '../lib/parcel-data';
import { ParcelStatus } from '@sllas/contracts';
import { useTheme } from 'next-themes';

interface SpatialMapProps {
  parcels: ParcelRecord[];
  selectedParcelId?: string | null;
  onSelectParcel?: (parcel: ParcelRecord) => void;
  onSelectProvince?: (province: string) => void;
  height?: number;
  highlightPolygon?: number[][];
}

type BoundaryFeature = Feature<Polygon | MultiPolygon>;
type BoundaryCollection = FeatureCollection<Polygon | MultiPolygon>;
type LeafletMap = ReturnType<typeof useMap>;

const ZIM_BOUNDS: [[number, number], [number, number]] = [
  [-22.8, 24.9],
  [-15.3, 33.4],
];
const ZIM_FIT_BOUNDS: [[number, number], [number, number]] = [
  [-22.5, 25.2],
  [-15.6, 33.1],
];
const ZIM_CENTER: [number, number] = [-19, 29.8];

const getStatusColor = (status: ParcelStatus, isLight = false) => {
  switch (status) {
    case ParcelStatus.AVAILABLE:
      return { fillColor: isLight ? '#15803d' : '#16a34a', color: isLight ? '#166534' : '#86efac' };
    case ParcelStatus.PENDING_VERIFICATION:
      return { fillColor: isLight ? '#b45309' : '#d97706', color: isLight ? '#92400e' : '#fbbf24' };
    case ParcelStatus.DRAFT:
      return { fillColor: isLight ? '#64748b' : '#64748b', color: isLight ? '#334155' : '#cbd5e1' };
    default:
      return { fillColor: isLight ? '#0e7490' : '#0e7490', color: isLight ? '#155e75' : '#67e8f9' };
  }
};

const asFeature = (geometry: unknown): BoundaryFeature | null => {
  if (!geometry || typeof geometry !== 'object') return null;
  const candidate = geometry as { type?: string; coordinates?: unknown };
  if (!candidate.coordinates || (candidate.type !== 'Polygon' && candidate.type !== 'MultiPolygon')) return null;
  return {
    type: 'Feature',
    properties: {},
    geometry: candidate as BoundaryFeature['geometry'],
  };
};

const getProvinceName = (feature: BoundaryFeature) =>
  String(feature.properties?.shapeName ?? feature.properties?.NAME_1 ?? feature.properties?.name ?? 'Unknown province');

function MapViewportController({ parcels }: { parcels: ParcelRecord[] }) {
  const map = useMap();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      map.fitBounds(ZIM_FIT_BOUNDS, { padding: [24, 24] });
      return;
    }

    if (parcels.length === 0) {
      map.fitBounds(ZIM_FIT_BOUNDS, { padding: [24, 24] });
      return;
    }

    const parcelFeatures = parcels.map(parcel => asFeature(parcel.boundary)).filter(Boolean) as BoundaryFeature[];
    if (parcelFeatures.length > 0) {
      const bounds = parcelFeatures.reduce((current, feature) => current.extend(L.geoJSON(feature).getBounds()), L.latLngBounds([]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
      }
    } else {
      map.fitBounds(ZIM_FIT_BOUNDS, { padding: [24, 24] });
    }
  }, [map, parcels]);

  return null;
}

function SelectedParcelController({ parcel }: { parcel: ParcelRecord | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (!parcel) return;
    const feature = asFeature(parcel.boundary);
    if (!feature) return;
    const bounds = L.geoJSON(feature).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [map, parcel]);

  return null;
}

function MapSizeController() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    const observer = new ResizeObserver(invalidate);
    observer.observe(map.getContainer());
    window.addEventListener('resize', invalidate);
    window.addEventListener('orientationchange', invalidate);
    invalidate();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('orientationchange', invalidate);
    };
  }, [map]);

  return null;
}

function MapControls() {
  const map = useMap();

  return (
    <div className="map-controls" style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div className="map-grid-label" style={{
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid var(--border-card)',
        borderRadius: '6px',
        padding: '7px 12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--text-main)',
      }}>
        <span style={{ color: '#4ade80', marginRight: '6px' }}>●</span>
        Zimbabwe National Cadastral Grid (SRID 4326)
      </div>
      <div className="map-zoom-controls" style={{
        display: 'flex',
        gap: '4px',
        background: 'rgba(15, 23, 42, 0.9)',
        padding: '4px',
        borderRadius: '6px',
        border: '1px solid var(--border-card)',
        width: 'fit-content',
      }}>
        <button className="map-control-button" onClick={() => map.zoomIn()} title="Zoom in">+</button>
        <button className="map-control-button" onClick={() => map.zoomOut()} title="Zoom out">−</button>
        <button className="map-reset-button" onClick={() => map.fitBounds(ZIM_FIT_BOUNDS, { padding: [24, 24] })}>
          Reset
        </button>
      </div>
    </div>
  );
}

function CoordinateReadout() {
  const [coordinate, setCoordinate] = useState<{ lat: number; lng: number } | null>(null);
  useMapEvents({
    mousemove: event => setCoordinate(event.latlng),
    mouseout: () => setCoordinate(null),
  });

  return (
    <div className="map-coordinate-readout" style={{
      position: 'absolute',
      right: '16px',
      bottom: '16px',
      zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.9)',
      border: '1px solid var(--border-card)',
      borderRadius: '4px',
      padding: '6px 9px',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.6875rem',
    }}>
      {coordinate
        ? `Lat ${coordinate.lat.toFixed(5)}  Lon ${coordinate.lng.toFixed(5)}`
        : 'Move pointer over map for coordinates'}
    </div>
  );
}

export function SpatialMap({
  parcels,
  selectedParcelId,
  onSelectParcel,
  onSelectProvince,
  height = 540,
}: SpatialMapProps) {
  const [hoveredParcel, setHoveredParcel] = useState<ParcelRecord | null>(null);
  const [boundaryData, setBoundaryData] = useState<{ country: BoundaryCollection; provinces: BoundaryCollection } | null>(null);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [tileError, setTileError] = useState(false);
  const [zoom, setZoom] = useState(6);
  const [invalidParcelIds, setInvalidParcelIds] = useState<string[]>([]);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/data/zimbabwe_adm0.geojson').then(response => {
        if (!response.ok) throw new Error('National boundary request failed');
        return response.json() as Promise<BoundaryCollection>;
      }),
      fetch('/data/zimbabwe_provinces.geojson').then(response => {
        if (!response.ok) throw new Error('Province boundary request failed');
        return response.json() as Promise<BoundaryCollection>;
      }),
    ]).then(([country, provinces]) => {
      if (active) setBoundaryData({ country, provinces });
    }).catch(() => {
      if (active) setBoundaryError('Zimbabwe boundary data could not be loaded. Map boundaries are unavailable.');
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!boundaryData?.country.features[0]) return;
    const country = boundaryData.country.features[0] as BoundaryFeature;
    const invalid = parcels.filter(parcel => {
      const { lat, lng } = parcel.centroid;
      return !Number.isFinite(lat) || !Number.isFinite(lng) ||
        !booleanPointInPolygon(point([lng, lat]), country);
    }).map(parcel => parcel.id);
    setInvalidParcelIds(invalid);
  }, [boundaryData, parcels]);

  const parcelFeatures = useMemo(() => parcels
    .map(parcel => ({ parcel, feature: asFeature(parcel.boundary) }))
    .filter((entry): entry is { parcel: ParcelRecord; feature: BoundaryFeature } => entry.feature !== null), [parcels]);

  const renderParcel = (entry: { parcel: ParcelRecord; feature: BoundaryFeature }) => {
    const { parcel, feature } = entry;
    const statusColor = getStatusColor(parcel.status, isLight);
    const selected = parcel.id === selectedParcelId;
    return (
      <GeoJSON
        key={parcel.id}
        data={feature}
        style={{
          color: selected ? '#ffffff' : statusColor.color,
          weight: selected ? 3 : 1.5,
          fillColor: statusColor.fillColor,
          fillOpacity: selected ? 0.55 : 0.3,
        }}
        eventHandlers={{
          mouseover: event => {
            setHoveredParcel(parcel);
            event.target.setStyle({ weight: 3, fillOpacity: 0.6 });
          },
          mouseout: event => {
            setHoveredParcel(null);
            event.target.setStyle({
              weight: selected ? 3 : 1.5,
              fillOpacity: selected ? 0.55 : 0.3,
            });
          },
          click: () => onSelectParcel?.(parcel),
        }}
      >
        <Popup>
          <strong>{parcel.referenceNumber}</strong><br />
          {parcel.name}<br />
          {parcel.district}, {parcel.province}<br />
          {parcel.areaHectares} ha · Region {parcel.naturalRegion ?? '—'}<br />
          Centroid: {parcel.centroid.lat.toFixed(5)}, {parcel.centroid.lng.toFixed(5)}
        </Popup>
      </GeoJSON>
    );
  };

  return (
    <div className="glass-panel map-shell" style={{ position: 'relative', overflow: 'hidden', height: 'clamp(420px, 70dvh, 800px)' }}>
      <MapContainer
        center={ZIM_CENTER}
        zoom={6}
        minZoom={5}
        maxZoom={18}
        maxBounds={ZIM_BOUNDS}
        maxBoundsViscosity={1}
        style={{ width: '100%', height: '100%', background: '#0b1320' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url={isLight
            ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'}
          subdomains="abcd"
          eventHandlers={{ tileerror: () => setTileError(true) }}
        />
        <ScaleControl position="bottomleft" imperial={false} />
        <MapSizeController />
        <MapControls />
        <CoordinateReadout />
        <MapViewportController parcels={parcels} />
        <SelectedParcelController parcel={parcels.find(parcel => parcel.id === selectedParcelId)} />
        <ZoomObserver onZoom={setZoom} />

        {boundaryData?.country && (
          <GeoJSON
            data={boundaryData.country}
            style={{ color: isLight ? '#006b3f' : '#4ade80', weight: 2, dashArray: '7 5', fillColor: isLight ? '#dcfce7' : '#166534', fillOpacity: isLight ? 0.12 : 0.06 }}
          />
        )}
        {boundaryData?.provinces && (
          <GeoJSON
            data={boundaryData.provinces}
            style={{ color: isLight ? '#64748b' : '#94a3b8', weight: 1, fillColor: isLight ? '#cbd5e1' : '#334155', fillOpacity: isLight ? 0.18 : 0.12 }}
            eventHandlers={{
              mouseover: event => event.target.setStyle({ weight: 2, color: isLight ? '#334155' : '#cbd5e1', fillOpacity: isLight ? 0.28 : 0.22 }),
              mouseout: event => event.target.setStyle({ weight: 1, color: isLight ? '#64748b' : '#94a3b8', fillOpacity: isLight ? 0.18 : 0.12 }),
              click: event => onSelectProvince?.(getProvinceName(event.target.feature as BoundaryFeature)),
            }}
            onEachFeature={(feature, layer) => {
              layer.bindTooltip(getProvinceName(feature as BoundaryFeature), { sticky: true });
            }}
          />
        )}

        {zoom < 8
          ? parcels.map(parcel => (
            <CircleMarker
              key={`centroid-${parcel.id}`}
              center={[parcel.centroid.lat, parcel.centroid.lng]}
              radius={parcel.id === selectedParcelId ? 7 : 4}
              pathOptions={{ color: getStatusColor(parcel.status, isLight).color, fillColor: getStatusColor(parcel.status, isLight).fillColor, fillOpacity: 0.9, weight: 1 }}
              eventHandlers={{ mouseover: () => setHoveredParcel(parcel), mouseout: () => setHoveredParcel(null), click: () => onSelectParcel?.(parcel) }}
            >
              <Popup>
                <strong>{parcel.referenceNumber}</strong><br />{parcel.name}
              </Popup>
            </CircleMarker>
          ))
          : parcelFeatures.map(renderParcel)}
      </MapContainer>

      <div className="map-legend" style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid var(--border-card)',
        borderRadius: '6px',
        padding: '10px 14px',
        fontSize: '0.6875rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {[
          [ParcelStatus.AVAILABLE, '#16a34a', 'Available'],
          [ParcelStatus.PENDING_VERIFICATION, '#d97706', 'Pending Verification'],
          [ParcelStatus.DRAFT, '#64748b', 'Draft'],
        ].map(([status, color, label]) => (
          <span key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '2px', background: color, display: 'inline-block' }} />
            {label} ({parcels.filter(parcel => parcel.status === status).length})
          </span>
        ))}
      </div>

      {boundaryError && (
        <div role="alert" style={{ position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, background: '#7f1d1d', color: '#fee2e2', padding: '10px 14px', borderRadius: '4px' }}>
          {boundaryError}
        </div>
      )}
      {tileError && (
        <div role="alert" style={{ position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, background: '#7f1d1d', color: '#fee2e2', padding: '10px 14px', borderRadius: '4px' }}>
          Basemap tiles could not be loaded. Boundary and parcel layers remain available.
        </div>
      )}
      {parcels.length === 0 && !boundaryError && (
        <div role="status" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border-card)', color: 'var(--text-muted)', padding: '14px 18px', borderRadius: '6px' }}>
          No parcels match
        </div>
      )}
      {invalidParcelIds.length > 0 && (
        <div role="status" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, background: 'rgba(127, 29, 29, 0.92)', color: '#fee2e2', padding: '8px 10px', borderRadius: '4px', fontSize: '0.6875rem' }}>
          {invalidParcelIds.length} parcel centroid{invalidParcelIds.length === 1 ? '' : 's'} outside Zimbabwe boundary
        </div>
      )}
      {hoveredParcel && (
        <div style={{ position: 'absolute', top: '82px', right: '16px', zIndex: 1000, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--primary-500)', borderRadius: '6px', padding: '12px 14px', maxWidth: '280px', color: '#fff' }}>
          <div style={{ color: 'var(--primary-400)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{hoveredParcel.referenceNumber}</div>
          <strong>{hoveredParcel.name}</strong>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{hoveredParcel.district}, {hoveredParcel.province}</div>
          <div style={{ marginTop: '6px', fontSize: '0.75rem' }}>{hoveredParcel.areaHectares} ha · Region {hoveredParcel.naturalRegion ?? '—'}</div>
        </div>
      )}
    </div>
  );
}

function ZoomObserver({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({ zoomend: event => onZoom(event.target.getZoom()) });
  return null;
}
