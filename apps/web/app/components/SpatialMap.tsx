'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  CircleMarker,
  ScaleControl,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { ParcelRecord } from '../lib/parcel-data';
import { VERIFIED_FARM_SUBDIVISIONS, FarmSubdivisionItem } from '../lib/farm-subdivisions';
import { ParcelStatus } from '@sllas/contracts';
import { useTheme } from 'next-themes';

export type BasemapMode = 'satellite' | 'terrain' | 'roads' | 'cadastre';

export interface SpatialMapProps {
  parcels: ParcelRecord[];
  selectedParcelId?: string | null;
  onSelectParcel?: (parcel: ParcelRecord) => void;
  onSelectProvince?: (province: string) => void;
  height?: number;
  highlightPolygon?: number[][];
}

type BoundaryFeature = Feature<Polygon | MultiPolygon>;
type BoundaryCollection = FeatureCollection<Polygon | MultiPolygon>;

const ZIM_BOUNDS: [[number, number], [number, number]] = [
  [-22.8, 24.9],
  [-15.3, 33.4],
];
const ZIM_FIT_BOUNDS: [[number, number], [number, number]] = [
  [-22.5, 25.2],
  [-15.6, 33.1],
];
const ZIM_CENTER: [number, number] = [-19.0154, 29.8];

interface BasemapConfig {
  id: BasemapMode;
  name: string;
  badge: string;
  tagline: string;
  url: string;
  attribution: string;
  maxZoom: number;
  supportsLabels?: boolean;
}

const BASEMAP_CONFIGS: Record<BasemapMode, BasemapConfig> = {
  satellite: {
    id: 'satellite',
    name: 'Satellite View',
    badge: '🛰️ Satellite',
    tagline: 'High-res aerial imagery of farmland, terrain & rivers',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; Maxar &copy; Earthstar Geographics',
    maxZoom: 19,
    supportsLabels: true,
  },
  terrain: {
    id: 'terrain',
    name: 'Terrain View',
    badge: '⛰️ Terrain',
    tagline: 'Topographic shaded relief, elevation contours & watersheds',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, DeLorme, NAVTEQ, TomTom, Intermap, USGS, FAO',
    maxZoom: 18,
  },
  roads: {
    id: 'roads',
    name: 'Roads & Highways',
    badge: '🛣️ Roads',
    tagline: 'National highways A1–A9, regional routes & farm feeder roads',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  cadastre: {
    id: 'cadastre',
    name: 'Cadastre Dark',
    badge: '🗺️ Cadastre',
    tagline: 'High-contrast dark baseline for survey beacon inspection',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap contributors',
    maxZoom: 16,
  },
};

const SATELLITE_LABELS_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_LABELS_ATTR = '&copy; Esri &mdash; Boundaries and Places';

const isFarmSubdivision = (p: ParcelRecord): p is FarmSubdivisionItem => {
  return 'schemeName' in p && typeof (p as any).schemeName === 'string';
};

const getStatusColor = (status: ParcelStatus, isLight = false, isSelected = false) => {
  if (isSelected) {
    return {
      fillColor: '#0284c7',
      color: '#38bdf8',
      accentColor: '#38bdf8',
      label: 'Selected Subdivision',
    };
  }
  switch (status) {
    case ParcelStatus.AVAILABLE:
      return {
        fillColor: isLight ? '#15803d' : '#16a34a',
        color: isLight ? '#166534' : '#4ade80',
        accentColor: '#4ade80',
        label: 'Available (A2 / A1)',
      };
    case ParcelStatus.PENDING_VERIFICATION:
      return {
        fillColor: isLight ? '#b45309' : '#d97706',
        color: isLight ? '#92400e' : '#fbbf24',
        accentColor: '#fbbf24',
        label: 'Pending Verification',
      };
    case ParcelStatus.DRAFT:
      return {
        fillColor: isLight ? '#475569' : '#64748b',
        color: isLight ? '#334155' : '#cbd5e1',
        accentColor: '#cbd5e1',
        label: 'Draft Survey',
      };
    default:
      return {
        fillColor: isLight ? '#0e7490' : '#0e7490',
        color: isLight ? '#155e75' : '#67e8f9',
        accentColor: '#67e8f9',
        label: 'Active Lease',
      };
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

function MapViewportController({
  parcels,
  focusTrigger,
}: {
  parcels: ParcelRecord[];
  focusTrigger: number;
}) {
  const map = useMap();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      map.fitBounds(ZIM_FIT_BOUNDS, { padding: [24, 24] });
      return;
    }

    if (focusTrigger > 0) {
      const parcelFeatures = parcels.map(parcel => asFeature(parcel.boundary)).filter(Boolean) as BoundaryFeature[];
      if (parcelFeatures.length > 0) {
        const bounds = parcelFeatures.reduce(
          (current, feature) => current.extend(L.geoJSON(feature).getBounds()),
          L.latLngBounds([])
        );
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
          return;
        }
      }
    }
  }, [map, parcels, focusTrigger]);

  return null;
}

function SelectedParcelController({ parcel }: { parcel: ParcelRecord | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (!parcel) return;
    const feature = asFeature(parcel.boundary);
    if (!feature) return;
    const bounds = L.geoJSON(feature).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
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

function CoordinateReadout({ basemapMode }: { basemapMode: BasemapMode }) {
  const [coordinate, setCoordinate] = useState<{ lat: number; lng: number } | null>(null);
  useMapEvents({
    mousemove: event => setCoordinate(event.latlng),
    mouseout: () => setCoordinate(null),
  });

  return (
    <div
      className="map-coordinate-readout"
      style={{
        position: 'absolute',
        right: '16px',
        bottom: '16px',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '6px',
        padding: '6px 12px',
        color: '#e2e8f0',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '0.6875rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span style={{ color: '#10b981', fontSize: '0.6rem' }}>●</span>
      <span>
        {coordinate
          ? `Lat ${coordinate.lat.toFixed(5)}° S  Lon ${coordinate.lng.toFixed(5)}° E (WGS 84)`
          : 'Point cursor to inspect coordinates'}
      </span>
      <span style={{ color: '#64748b' }}>|</span>
      <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{basemapMode}</span>
    </div>
  );
}

function ZoomObserver({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({ zoomend: event => onZoom(event.target.getZoom()) });
  return null;
}

export function SpatialMap({
  parcels,
  selectedParcelId,
  onSelectParcel,
  onSelectProvince,
  height = 580,
  highlightPolygon,
}: SpatialMapProps) {
  const [hoveredParcel, setHoveredParcel] = useState<ParcelRecord | null>(null);
  const [boundaryData, setBoundaryData] = useState<{ country: BoundaryCollection; provinces: BoundaryCollection } | null>(null);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(6);
  const [invalidParcelIds, setInvalidParcelIds] = useState<string[]>([]);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // Basemap & Layer Control States
  const [basemapMode, setBasemapMode] = useState<BasemapMode>('satellite');
  const [showFarmSubdivisions, setShowFarmSubdivisions] = useState(true);
  const [showProvinces, setShowProvinces] = useState(true);
  const [showSatelliteLabels, setShowSatelliteLabels] = useState(true);
  const [showBeacons, setShowBeacons] = useState(true);
  const [layersMenuOpen, setLayersMenuOpen] = useState(true);
  const [focusTrigger, setFocusTrigger] = useState(0);

  // Active parcels fallback to verified farm subdivisions so map is never empty
  const activeParcels = useMemo(() => {
    if (parcels && parcels.length > 0) return parcels;
    return VERIFIED_FARM_SUBDIVISIONS;
  }, [parcels]);

  const mapInstanceRef = useRef<L.Map | null>(null);

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
    ])
      .then(([country, provinces]) => {
        if (active) setBoundaryData({ country, provinces });
      })
      .catch(() => {
        if (active) setBoundaryError('Zimbabwe boundary data could not be loaded. Provincial overlay unavailable.');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!boundaryData?.country.features[0]) return;
    const country = boundaryData.country.features[0] as BoundaryFeature;
    const invalid = activeParcels
      .filter(parcel => {
        const { lat, lng } = parcel.centroid;
        return (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          !booleanPointInPolygon(point([lng, lat]), country)
        );
      })
      .map(parcel => parcel.id);
    setInvalidParcelIds(invalid);
  }, [boundaryData, activeParcels]);

  const parcelFeatures = useMemo(
    () =>
      activeParcels
        .map(parcel => ({ parcel, feature: asFeature(parcel.boundary) }))
        .filter((entry): entry is { parcel: ParcelRecord; feature: BoundaryFeature } => entry.feature !== null),
    [activeParcels]
  );

  const activeBasemap = BASEMAP_CONFIGS[basemapMode];

  const handleResetZimbabwe = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(ZIM_FIT_BOUNDS, { padding: [24, 24] });
    }
  };

  const handleFocusFarms = () => {
    setFocusTrigger(prev => prev + 1);
  };

  return (
    <div
      className="glass-panel map-shell"
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: typeof height === 'number' ? `${height}px` : 'clamp(460px, 72dvh, 850px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        background: '#070d18',
      }}
    >
      {/* Top Left: Map Grid Title & Quick Zoom Actions */}
      <div
        className="map-controls"
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          className="map-grid-label"
          style={{
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
              display: 'inline-block',
            }}
          />
          <span>Zimbabwe Cadastral Grid (SRID 4326)</span>
          <span
            style={{
              fontSize: '0.6875rem',
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {activeBasemap.badge}
          </span>
        </div>

        <div
          className="map-zoom-controls"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            width: 'fit-content',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <button
            className="map-control-button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Zoom in"
            style={{
              width: '32px',
              height: '32px',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '1.1rem',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            +
          </button>
          <button
            className="map-control-button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Zoom out"
            style={{
              width: '32px',
              height: '32px',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '1.1rem',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            −
          </button>
          <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
          <button
            className="map-reset-button"
            onClick={handleResetZimbabwe}
            title="Fit Zimbabwe boundary"
            style={{
              padding: '0 10px',
              height: '32px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            Reset Zim
          </button>
          <button
            className="map-reset-button"
            onClick={handleFocusFarms}
            title="Zoom to Farm Subdivisions"
            style={{
              padding: '0 10px',
              height: '32px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            🚜 Focus Farms ({activeParcels.length})
          </button>
        </div>
      </div>

      {/* Top Right: Modern Layer & Basemap Switcher Control Deck */}
      <div
        className="map-layer-deck"
        style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
          maxWidth: '380px',
        }}
      >
        {/* Basemap Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '10px',
            padding: '4px',
            gap: '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {(
            [
              ['satellite', '🛰️ Satellite'],
              ['terrain', '⛰️ Terrain'],
              ['roads', '🛣️ Roads'],
              ['cadastre', '🗺️ Cadastre'],
            ] as const
          ).map(([mode, label]) => {
            const active = basemapMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setBasemapMode(mode)}
                style={{
                  padding: '7px 11px',
                  borderRadius: '6px',
                  border: active ? '1px solid #10b981' : '1px solid transparent',
                  background: active ? 'linear-gradient(135deg, #059669, #047857)' : 'transparent',
                  color: active ? '#ffffff' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
                title={BASEMAP_CONFIGS[mode].tagline}
              >
                {label}
              </button>
            );
          })}
          <button
            onClick={() => setLayersMenuOpen(prev => !prev)}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: layersMenuOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: '#e2e8f0',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
            title="Toggle Cadastral Layers Tray"
          >
            {layersMenuOpen ? '▲ Layers' : '▼ Layers'}
          </button>
        </div>

        {/* Collapsible Cadastral Overlays Tray */}
        {layersMenuOpen && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '10px 14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Cadastral Overlays & Data
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showFarmSubdivisions}
                onChange={e => setShowFarmSubdivisions(e.target.checked)}
                style={{ accentColor: '#10b981', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>🚜 Farm Subdivisions & Schemes</span>
              <span style={{ marginLeft: 'auto', color: '#34d399', fontSize: '0.7rem' }}>({activeParcels.length})</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showProvinces}
                onChange={e => setShowProvinces(e.target.checked)}
                style={{ accentColor: '#10b981', cursor: 'pointer' }}
              />
              <span>🏛️ Provincial Cadastre Grid</span>
              <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.7rem' }}>10 Adm-1</span>
            </label>

            {basemapMode === 'satellite' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showSatelliteLabels}
                  onChange={e => setShowSatelliteLabels(e.target.checked)}
                  style={{ accentColor: '#10b981', cursor: 'pointer' }}
                />
                <span>🏷️ Road & Town Labels</span>
                <span style={{ marginLeft: 'auto', color: '#38bdf8', fontSize: '0.7rem' }}>Esri Hybrid</span>
              </label>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showBeacons}
                onChange={e => setShowBeacons(e.target.checked)}
                style={{ accentColor: '#10b981', cursor: 'pointer' }}
              />
              <span>📍 Survey Beacons (BC-XX)</span>
              <span style={{ marginLeft: 'auto', color: '#fbbf24', fontSize: '0.7rem' }}>Vertices</span>
            </label>
          </div>
        )}
      </div>

      {/* Main Leaflet Map Engine */}
      <MapContainer
        center={ZIM_CENTER}
        zoom={6}
        minZoom={5}
        maxZoom={19}
        maxBounds={ZIM_BOUNDS}
        maxBoundsViscosity={0.9}
        style={{ width: '100%', height: '100%', background: '#070d18' }}
        ref={mapInstanceRef}
      >
        {/* Active High-Resolution Basemap Tile Layer */}
        <TileLayer
          key={activeBasemap.id}
          attribution={activeBasemap.attribution}
          url={activeBasemap.url}
          maxZoom={activeBasemap.maxZoom}
        />

        {/* Satellite Place Names & Highways Hybrid Overlay */}
        {basemapMode === 'satellite' && showSatelliteLabels && (
          <TileLayer
            key="satellite-hybrid-overlay"
            attribution={SATELLITE_LABELS_ATTR}
            url={SATELLITE_LABELS_URL}
            maxZoom={19}
            opacity={0.88}
          />
        )}

        <ScaleControl position="bottomleft" imperial={false} />
        <MapSizeController />
        <CoordinateReadout basemapMode={basemapMode} />
        <MapViewportController parcels={activeParcels} focusTrigger={focusTrigger} />
        <SelectedParcelController parcel={activeParcels.find(parcel => parcel.id === selectedParcelId)} />
        <ZoomObserver onZoom={setZoom} />

        {/* Zimbabwe Sovereign National Border */}
        {boundaryData?.country && (
          <GeoJSON
            key="zim-country-boundary"
            data={boundaryData.country}
            style={{
              color: basemapMode === 'satellite' ? '#34d399' : '#10b981',
              weight: 2.2,
              dashArray: '6 4',
              fillColor: '#10b981',
              fillOpacity: 0.02,
            }}
          />
        )}

        {/* Zimbabwe Provincial Cadastral Boundaries */}
        {showProvinces && boundaryData?.provinces && (
          <GeoJSON
            key={`zim-provinces-${basemapMode}`}
            data={boundaryData.provinces}
            style={{
              color: basemapMode === 'satellite' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(148, 163, 184, 0.5)',
              weight: 1.2,
              dashArray: '4 4',
              fillColor: '#38bdf8',
              fillOpacity: basemapMode === 'satellite' ? 0.03 : 0.05,
            }}
            eventHandlers={{
              mouseover: event => {
                event.target.setStyle({
                  weight: 2.2,
                  color: '#38bdf8',
                  fillOpacity: 0.15,
                });
              },
              mouseout: event => {
                event.target.setStyle({
                  weight: 1.2,
                  color: basemapMode === 'satellite' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(148, 163, 184, 0.5)',
                  fillOpacity: basemapMode === 'satellite' ? 0.03 : 0.05,
                });
              },
              click: event => onSelectProvince?.(getProvinceName(event.target.feature as BoundaryFeature)),
            }}
            onEachFeature={(feature, layer) => {
              layer.bindTooltip(
                `<div style="font-weight: 700; font-size: 0.75rem;">${getProvinceName(feature as BoundaryFeature)} Province</div>`,
                { sticky: true, className: 'sllas-tooltip' }
              );
            }}
          />
        )}

        {/* Active Highlight Polygon (e.g., when registering/drawing a new parcel) */}
        {highlightPolygon && highlightPolygon.length > 2 && (
          <GeoJSON
            key="highlight-poly"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [highlightPolygon],
              },
            } as any}
            style={{
              color: '#38bdf8',
              weight: 3,
              fillColor: '#38bdf8',
              fillOpacity: 0.45,
            }}
          />
        )}

        {/* Farm Subdivisions & Cadastral Parcels Layer */}
        {showFarmSubdivisions &&
          parcelFeatures.map(({ parcel, feature }) => {
            const isSelected = parcel.id === selectedParcelId;
            const statusConfig = getStatusColor(parcel.status, isLight, isSelected);
            const isSubdiv = isFarmSubdivision(parcel);

            // Extract vertices for survey beacon rendering
            const polygonCoords =
              parcel.boundary?.type === 'Polygon' && Array.isArray(parcel.boundary.coordinates?.[0])
                ? (parcel.boundary.coordinates[0] as number[][])
                : [];

            return (
              <React.Fragment key={parcel.id}>
                {/* 1. Boundary Polygon with Surveyor Line */}
                <GeoJSON
                  data={feature}
                  style={{
                    color: isSelected ? '#ffffff' : statusConfig.color,
                    weight: isSelected ? 3.5 : 2.2,
                    dashArray: isSubdiv ? '6 3' : undefined,
                    fillColor: statusConfig.fillColor,
                    fillOpacity: isSelected ? 0.55 : basemapMode === 'satellite' ? 0.38 : 0.28,
                  }}
                  eventHandlers={{
                    mouseover: event => {
                      setHoveredParcel(parcel);
                      event.target.setStyle({ weight: 3.5, fillOpacity: 0.65 });
                    },
                    mouseout: event => {
                      setHoveredParcel(null);
                      event.target.setStyle({
                        weight: isSelected ? 3.5 : 2.2,
                        fillOpacity: isSelected ? 0.55 : basemapMode === 'satellite' ? 0.38 : 0.28,
                      });
                    },
                    click: () => onSelectParcel?.(parcel),
                  }}
                >
                  <Popup className="sllas-cadastral-popup" maxWidth={360}>
                    <div style={{ padding: '6px 4px', color: '#0f172a', fontFamily: 'var(--font-sans, sans-serif)' }}>
                      {/* Classification Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span
                          style={{
                            background: parcel.status === ParcelStatus.AVAILABLE ? '#16a34a' : '#d97706',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {parcel.status}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {parcel.referenceNumber}
                        </span>
                      </div>

                      {/* Title & Lot */}
                      <h3 style={{ margin: '4px 0 2px 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                        {isSubdiv ? parcel.schemeName : parcel.name}
                      </h3>
                      {isSubdiv && (
                        <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600, marginBottom: '6px' }}>
                          {parcel.lotNumber}
                        </div>
                      )}

                      <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '8px' }}>
                        📍 {parcel.district}, {parcel.province} ({parcel.ward})
                      </div>

                      {/* Cadastral Specs Table */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '8px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '6px',
                          fontSize: '0.72rem',
                          marginBottom: '10px',
                        }}
                      >
                        <div>
                          <span style={{ color: '#64748b' }}>Hectarage:</span>{' '}
                          <strong>{parcel.areaHectares} ha</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Agro Region:</span>{' '}
                          <strong>{parcel.naturalRegion ?? 'Unclassified'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Soil Type:</span>{' '}
                          <strong>{parcel.soilType ?? 'Arable Loam'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Tenure Scheme:</span>{' '}
                          <strong>{parcel.leaseClassification?.code ?? parcel.landCategory}</strong>
                        </div>
                      </div>

                      {isSubdiv && (
                        <div style={{ fontSize: '0.7rem', color: '#334155', marginBottom: '8px', lineHeight: 1.4 }}>
                          <div><strong>Survey Diagram:</strong> {parcel.surveyDiagramNumber}</div>
                          <div><strong>Water Sources:</strong> {parcel.waterSources?.join(', ') ?? 'Borehole / Riparian'}</div>
                          {parcel.knownRestrictions && (
                            <div style={{ color: '#b45309', marginTop: '3px' }}>
                              ⚠️ <em>{parcel.knownRestrictions}</em>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => onSelectParcel?.(parcel)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginTop: '4px',
                        }}
                      >
                        Inspect Full Farm Cadastre Dossier →
                      </button>
                    </div>
                  </Popup>
                </GeoJSON>

                {/* 2. Permanent/Hover Centroid Tag for Farm Subdivisions */}
                <CircleMarker
                  center={[parcel.centroid.lat, parcel.centroid.lng]}
                  radius={isSelected ? 8 : zoom >= 10 ? 6 : 4.5}
                  pathOptions={{
                    color: isSelected ? '#ffffff' : statusConfig.color,
                    fillColor: statusConfig.fillColor,
                    fillOpacity: 0.95,
                    weight: isSelected ? 2.5 : 1.5,
                  }}
                  eventHandlers={{
                    mouseover: () => setHoveredParcel(parcel),
                    mouseout: () => setHoveredParcel(null),
                    click: () => onSelectParcel?.(parcel),
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -6]}
                    opacity={0.94}
                    permanent={zoom >= 11 || isSelected}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.72rem' }}>
                      🚜 {isSubdiv ? parcel.lotNumber : parcel.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                      {parcel.areaHectares} ha · {parcel.district}
                    </div>
                  </Tooltip>
                </CircleMarker>

                {/* 3. Cadastral Corner Beacons (Vertices) */}
                {showBeacons &&
                  zoom >= 10 &&
                  polygonCoords.slice(0, -1).map((coord, idx) => {
                    const beaconName =
                      isSubdiv && parcel.cadastralBeaconRefs && parcel.cadastralBeaconRefs[idx]
                        ? parcel.cadastralBeaconRefs[idx]
                        : `BC-${idx + 1}`;
                    return (
                      <CircleMarker
                        key={`beacon-${parcel.id}-${idx}`}
                        center={[coord[1], coord[0]]}
                        radius={3}
                        pathOptions={{
                          color: '#f59e0b',
                          fillColor: '#fbbf24',
                          fillOpacity: 1,
                          weight: 1.5,
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -4]} opacity={0.92}>
                          <span style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>
                            📍 {beaconName} ({coord[1].toFixed(4)}, {coord[0].toFixed(4)})
                          </span>
                        </Tooltip>
                      </CircleMarker>
                    );
                  })}
              </React.Fragment>
            );
          })}
      </MapContainer>

      {/* Bottom Left: Status Legend & Agricultural Scheme Breakdown */}
      <div
        className="map-legend"
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.7rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontWeight: 600 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#16a34a', display: 'inline-block' }} />
          Available ({activeParcels.filter(p => p.status === ParcelStatus.AVAILABLE).length})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: 600 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#d97706', display: 'inline-block' }} />
          Pending ({activeParcels.filter(p => p.status === ParcelStatus.PENDING_VERIFICATION).length})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontWeight: 600 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#64748b', display: 'inline-block' }} />
          Draft / Active ({activeParcels.filter(p => p.status !== ParcelStatus.AVAILABLE && p.status !== ParcelStatus.PENDING_VERIFICATION).length})
        </span>
        <span style={{ color: '#475569' }}>|</span>
        <span style={{ color: '#cbd5e1' }}>
          Total Farm Subdivisions: <strong style={{ color: '#38bdf8' }}>{activeParcels.length}</strong>
        </span>
      </div>

      {/* Floating Hover Card */}
      {hoveredParcel && (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            right: '16px',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '12px 16px',
            maxWidth: '300px',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ color: '#34d399', fontFamily: 'monospace', fontSize: '0.6875rem' }}>
            {hoveredParcel.referenceNumber}
          </div>
          <strong style={{ fontSize: '0.875rem', display: 'block', margin: '2px 0' }}>
            {isFarmSubdivision(hoveredParcel) ? hoveredParcel.schemeName : hoveredParcel.name}
          </strong>
          {isFarmSubdivision(hoveredParcel) && (
            <div style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600 }}>
              {hoveredParcel.lotNumber}
            </div>
          )}
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>
            {hoveredParcel.district}, {hoveredParcel.province}
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#e2e8f0' }}>
            <strong>{hoveredParcel.areaHectares} ha</strong> · Region {hoveredParcel.naturalRegion ?? '—'}
          </div>
        </div>
      )}

      {/* Non-intrusive Alerts */}
      {boundaryError && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            background: 'rgba(127, 29, 29, 0.95)',
            border: '1px solid #ef4444',
            color: '#fee2e2',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '0.75rem',
          }}
        >
          {boundaryError}
        </div>
      )}

      {invalidParcelIds.length > 0 && (
        <div
          role="status"
          style={{
            position: 'absolute',
            top: '74px',
            left: '14px',
            zIndex: 1000,
            background: 'rgba(127, 29, 29, 0.92)',
            color: '#fee2e2',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '0.6875rem',
          }}
        >
          {invalidParcelIds.length} parcel centroid{invalidParcelIds.length === 1 ? '' : 's'} outside Zimbabwe boundary
        </div>
      )}
    </div>
  );
}
