'use client';

import React, { useState } from 'react';
import { ParcelRecord, ZIMBABWE_PROVINCES } from '../lib/parcel-data';
import { ParcelStatus } from '@sllas/contracts';

interface SpatialMapProps {
  parcels: ParcelRecord[];
  selectedParcelId?: string | null;
  onSelectParcel?: (parcel: ParcelRecord) => void;
  height?: number;
  highlightPolygon?: number[][];
}

// Bounding box for Zimbabwe GIS
const ZIM_BOUNDS = {
  minLng: 25.0,
  maxLng: 33.5,
  minLat: -22.5,
  maxLat: -15.5,
};

export function SpatialMap({
  parcels,
  selectedParcelId,
  onSelectParcel,
  height = 540,
  highlightPolygon,
}: SpatialMapProps) {
  const [hoveredParcel, setHoveredParcel] = useState<ParcelRecord | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map projection: WGS84 (lng, lat) -> SVG (x, y)
  const svgWidth = 800;
  const svgHeight = 600;

  const project = (lng: number, lat: number) => {
    const x = ((lng - ZIM_BOUNDS.minLng) / (ZIM_BOUNDS.maxLng - ZIM_BOUNDS.minLng)) * svgWidth;
    // Latitude is inverted in SVG y-axis (higher lat = more northern = lower y)
    const y = ((ZIM_BOUNDS.maxLat - lat) / (ZIM_BOUNDS.maxLat - ZIM_BOUNDS.minLat)) * svgHeight;
    return [x, y];
  };

  const getStatusColor = (status: ParcelStatus) => {
    switch (status) {
      case ParcelStatus.AVAILABLE:
        return { fill: 'rgba(34, 197, 94, 0.35)', stroke: '#4ade80' };
      case ParcelStatus.PENDING_VERIFICATION:
        return { fill: 'rgba(245, 158, 11, 0.4)', stroke: '#fbbf24' };
      case ParcelStatus.DRAFT:
        return { fill: 'rgba(148, 163, 184, 0.3)', stroke: '#cbd5e1' };
      case ParcelStatus.ALLOCATED:
        return { fill: 'rgba(249, 115, 22, 0.35)', stroke: '#fdba74' };
      case ParcelStatus.LEASED:
        return { fill: 'rgba(14, 165, 233, 0.35)', stroke: '#7dd3fc' };
      case ParcelStatus.DISPUTED:
        return { fill: 'rgba(239, 68, 68, 0.4)', stroke: '#f87171' };
      default:
        return { fill: 'rgba(100, 116, 139, 0.3)', stroke: '#94a3b8' };
    }
  };

  return (
    <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden', height: `${height}px`, display: 'flex', flexDirection: 'column' }}>
      {/* Map Overlay Controls */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-card)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          Zimbabwe National Cadastral Grid (SRID 4326)
        </div>

        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '4px',
          borderRadius: '6px',
          border: '1px solid var(--border-card)',
          width: 'fit-content'
        }}>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.3, 3))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.3, 0.8))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            title="Zoom Out"
          >
            -
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              padding: '0 8px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
            title="Reset View"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        zIndex: 10,
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-card)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '0.6875rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(34, 197, 94, 0.6)', border: '1px solid #4ade80' }} />
          <span>Available ({parcels.filter(p => p.status === ParcelStatus.AVAILABLE).length})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.6)', border: '1px solid #fbbf24' }} />
          <span>Pending Verification ({parcels.filter(p => p.status === ParcelStatus.PENDING_VERIFICATION).length})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(148, 163, 184, 0.6)', border: '1px solid #cbd5e1' }} />
          <span>Draft ({parcels.filter(p => p.status === ParcelStatus.DRAFT).length})</span>
        </div>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredParcel && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--primary-500)',
          borderRadius: '10px',
          padding: '14px 18px',
          maxWidth: '300px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontWeight: 600 }}>
              {hoveredParcel.referenceNumber}
            </span>
            <span className={`badge badge-${hoveredParcel.status.toLowerCase().replace('_', '-')}`} style={{ fontSize: '0.625rem' }}>
              {hoveredParcel.status}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '4px', color: '#fff' }}>
            {hoveredParcel.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {hoveredParcel.district}, {hoveredParcel.province}
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Area: </span>
              <strong>{hoveredParcel.areaHectares} ha</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Region: </span>
              <strong>Region {hoveredParcel.naturalRegion}</strong>
            </div>
          </div>
        </div>
      )}

      {/* SVG Map Canvas */}
      <div style={{ width: '100%', height: '100%', cursor: 'grab' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease',
          }}
        >
          {/* Subtle Grid Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

          {/* Stylized Zimbabwe National Boundary Outline */}
          <path
            d="M 120 180 Q 240 100 440 90 Q 640 120 720 250 Q 750 350 680 480 Q 560 560 420 540 Q 250 510 160 410 Q 90 280 120 180 Z"
            fill="rgba(15, 23, 42, 0.4)"
            stroke="rgba(74, 222, 128, 0.2)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />

          {/* Provincial Reference Centers */}
          {ZIMBABWE_PROVINCES.map(prov => {
            const [cx, cy] = project(prov.center.lng, prov.center.lat);
            return (
              <g key={prov.code} opacity={0.6}>
                <circle cx={cx} cy={cy} r="4" fill="rgba(217, 119, 6, 0.4)" stroke="rgba(217, 119, 6, 0.8)" strokeWidth="1" />
                <text
                  x={cx}
                  y={cy - 8}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="var(--font-heading)"
                  fontWeight="600"
                  textAnchor="middle"
                  style={{ pointerEvents: 'none' }}
                >
                  {prov.name}
                </text>
              </g>
            );
          })}

          {/* Highlight Polygon (e.g. from Boundary Editor) */}
          {highlightPolygon && highlightPolygon.length >= 3 && (
            <polygon
              points={highlightPolygon.map(pt => project(pt[0], pt[1]).join(',')).join(' ')}
              fill="rgba(236, 72, 153, 0.35)"
              stroke="#f472b6"
              strokeWidth="3"
              strokeDasharray="4 2"
            />
          )}

          {/* Render All Parcel Boundary Polygons */}
          {parcels.map(parcel => {
            const coords = parcel.boundary.coordinates[0];
            const pointsStr = coords.map(pt => project(pt[0], pt[1]).join(',')).join(' ');
            const [cx, cy] = project(parcel.centroid.lng, parcel.centroid.lat);
            const style = getStatusColor(parcel.status);
            const isSelected = selectedParcelId === parcel.id;

            return (
              <g
                key={parcel.id}
                onMouseEnter={() => setHoveredParcel(parcel)}
                onMouseLeave={() => setHoveredParcel(null)}
                onClick={() => onSelectParcel && onSelectParcel(parcel)}
                style={{ cursor: 'pointer' }}
              >
                {/* Polygon Boundary */}
                <polygon
                  points={pointsStr}
                  fill={style.fill}
                  stroke={isSelected ? '#ffffff' : style.stroke}
                  strokeWidth={isSelected ? 3 : 1.5}
                  filter={isSelected ? 'drop-shadow(0 0 8px #ffffff)' : undefined}
                />

                {/* Centroid Pin */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 6 : 4}
                  fill={style.stroke}
                  stroke="#0f172a"
                  strokeWidth="2"
                />

                {/* Parcel Reference Label */}
                <text
                  x={cx}
                  y={cy + 14}
                  fill={isSelected ? '#ffffff' : '#cbd5e1'}
                  fontSize={isSelected ? "10" : "8"}
                  fontFamily="var(--font-mono)"
                  fontWeight={isSelected ? "700" : "500"}
                  textAnchor="middle"
                  style={{ pointerEvents: 'none' }}
                >
                  {parcel.referenceNumber}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
