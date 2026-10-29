'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../components/AppContext';
import { SpatialMap } from '../../components/SpatialMap';
import {
  ZIMBABWE_PROVINCES,
  calculatePolygonAreaHa,
  calculateCentroid,
  checkBoundingBoxOverlap,
} from '../../lib/parcel-data';
import { ParcelStatus, NaturalRegion, SoilType } from '@sllas/contracts';

// Preset valid boundary templates for Zimbabwe provinces
const SAMPLE_BOUNDARIES: Record<string, { name: string; coords: number[][] }> = {
  harare_industrial: {
    name: 'Harare East High-Tech Park',
    coords: [
      [31.120, -17.810],
      [31.140, -17.810],
      [31.140, -17.830],
      [31.120, -17.830],
      [31.120, -17.810],
    ],
  },
  mashonaland_commercial: {
    name: 'Mazowe Citrus & Grain Valley',
    coords: [
      [30.950, -17.520],
      [30.985, -17.520],
      [30.985, -17.555],
      [30.950, -17.555],
      [30.950, -17.520],
    ],
  },
  midlands_ranch: {
    name: 'Gweru Savanna Grazing Section C',
    coords: [
      [29.720, -19.380],
      [29.760, -19.380],
      [29.760, -19.420],
      [29.720, -19.420],
      [29.720, -19.380],
    ],
  },
  manicaland_orchard: {
    name: 'Nyanga Highland Macadamia Zone',
    coords: [
      [32.710, -18.210],
      [32.740, -18.210],
      [32.740, -18.240],
      [32.710, -18.240],
      [32.710, -18.210],
    ],
  },
  overlapping_conflict: {
    name: 'Conflict Test (Overlaps Banket Estate)',
    coords: [
      [30.390, -17.415],
      [30.415, -17.415],
      [30.415, -17.440],
      [30.390, -17.440],
      [30.390, -17.415],
    ],
  },
};

export default function NewParcelPage() {
  const router = useRouter();
  const { parcels, addParcel } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [referenceNumber, setReferenceNumber] = useState(`ZWE-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState('');
  const [province, setProvince] = useState('Harare');
  const [district, setDistrict] = useState('Harare North');
  const [ward, setWard] = useState('Ward 12');
  const [landCategory, setLandCategory] = useState('State Land');
  const [naturalRegion, setNaturalRegion] = useState<NaturalRegion>(NaturalRegion.II);
  const [soilType, setSoilType] = useState<SoilType>(SoilType.LOAM);
  const [waterSources, setWaterSources] = useState('Municipal Borehole, River Canal');
  const [roadAccess, setRoadAccess] = useState(true);
  const [electricityAccess, setElectricityAccess] = useState(true);
  const [gridProximityKm, setGridProximityKm] = useState(0.8);
  const [terrain, setTerrain] = useState('Flat Arable');
  const [currentUse, setCurrentUse] = useState('Idle Fallov');
  const [permittedUses, setPermittedUses] = useState('Agro-Processing, Horticulture, Commercial');
  const [knownRestrictions, setKnownRestrictions] = useState('None recorded in deeds registry');

  // Boundary State
  const [boundaryCoords, setBoundaryCoords] = useState<number[][]>(
    SAMPLE_BOUNDARIES.harare_industrial.coords,
  );
  const [rawCoordsText, setRawCoordsText] = useState(
    JSON.stringify(SAMPLE_BOUNDARIES.harare_industrial.coords, null, 2),
  );

  // Boundary Geometry Calculations
  const computedArea = useMemo(() => calculatePolygonAreaHa(boundaryCoords), [boundaryCoords]);
  const computedCentroid = useMemo(() => calculateCentroid(boundaryCoords), [boundaryCoords]);

  // Spatial Validation & Overlap Detection
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (boundaryCoords.length < 4) {
      errs.push('Polygon requires at least 4 coordinates (closed ring).');
    } else {
      const first = boundaryCoords[0];
      const last = boundaryCoords[boundaryCoords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        errs.push('First and last coordinates must be identical to form a closed ring.');
      }
    }

    // WGS84 range check for Zimbabwe
    for (const [lng, lat] of boundaryCoords) {
      if (lat < -22.5 || lat > -15.5 || lng < 25.0 || lng > 33.5) {
        errs.push(`Coordinate [${lng}, ${lat}] is outside Zimbabwe territorial bounds (lat -22.5 to -15.5, lng 25.0 to 33.5).`);
        break;
      }
    }

    return errs;
  }, [boundaryCoords]);

  // Real-time overlap check against existing active parcels
  const overlappingParcel = useMemo(() => {
    if (validationErrors.length > 0) return null;
    return parcels.find(p => {
      if (p.status === ParcelStatus.WITHDRAWN) return false;
      return checkBoundingBoxOverlap(boundaryCoords, p.boundary.coordinates[0]);
    });
  }, [boundaryCoords, validationErrors, parcels]);

  const handleApplyPreset = (key: string) => {
    const preset = SAMPLE_BOUNDARIES[key];
    if (preset) {
      setBoundaryCoords(preset.coords);
      setRawCoordsText(JSON.stringify(preset.coords, null, 2));
      if (!name) setName(preset.name);
    }
  };

  const handleCoordsChange = (text: string) => {
    setRawCoordsText(text);
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
        setBoundaryCoords(parsed);
      }
    } catch {
      // Ignored during typing
    }
  };

  const handleSubmit = (targetStatus: ParcelStatus) => {
    if (validationErrors.length > 0) {
      alert(`Cannot submit: ${validationErrors[0]}`);
      return;
    }
    if (overlappingParcel) {
      alert(`Cadastral conflict: Boundary overlaps with registered parcel ${overlappingParcel.referenceNumber} (${overlappingParcel.name}). Overlapping allocations are prohibited by law.`);
      return;
    }

    const created = addParcel({
      referenceNumber,
      name: name.trim() || `Parcel ${referenceNumber}`,
      province,
      district,
      ward,
      landCategory,
      areaHectares: computedArea,
      status: targetStatus,
      boundary: {
        type: 'Polygon',
        coordinates: [boundaryCoords],
      },
      centroid: computedCentroid,
      naturalRegion,
      soilType,
      waterSources: waterSources.split(',').map(s => s.trim()).filter(Boolean),
      roadAccess,
      electricityAccess,
      gridProximityKm,
      terrain,
      currentUse,
      permittedUses: permittedUses.split(',').map(s => s.trim()).filter(Boolean),
      knownRestrictions,
    });

    if (targetStatus === ParcelStatus.PENDING_VERIFICATION) {
      router.push('/parcels/verify');
    } else {
      router.push(`/parcels/${created.id}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.2)', color: 'var(--primary-400)' }}>
            WORKBENCH
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Republic of Zimbabwe Cadastre</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', color: '#ffffff' }}>New Land Parcel Registration</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Register an idle land parcel with polygon coordinates, PostGIS geometry calculations, and real-time cadastral overlap detection.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="glass-panel" style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {[
          { step: 1, label: '1. Identity & Location' },
          { step: 2, label: '2. Agro-Ecological Attributes' },
          { step: 3, label: '3. Spatial Boundary & Overlap Check' },
          { step: 4, label: '4. Summary & Submit' },
        ].map(item => (
          <button
            key={item.step}
            onClick={() => setCurrentStep(item.step)}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: currentStep === item.step ? 'var(--primary-400)' : currentStep > item.step ? '#ffffff' : 'var(--text-dim)',
              fontWeight: currentStep === item.step ? 700 : 500,
              fontSize: '0.875rem'
            }}
          >
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: currentStep === item.step ? 'var(--primary-500)' : currentStep > item.step ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              color: currentStep === item.step ? '#ffffff' : currentStep > item.step ? 'var(--primary-400)' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {item.step}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Step 1: Identification & Location */}
      {currentStep === 1 && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Step 1: Jurisdiction & Identification</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Parcel Reference Number *
              </label>
              <input
                type="text"
                className="glass-input"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Descriptive Parcel Name *
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. Norton Agricultural Commercial Plot 4"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Province *
              </label>
              <select
                className="glass-input"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              >
                {ZIMBABWE_PROVINCES.map(p => (
                  <option key={p.code} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                District *
              </label>
              <input
                type="text"
                className="glass-input"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Ward / Sub-location
              </label>
              <input
                type="text"
                className="glass-input"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Tenure / Land Category *
              </label>
              <select
                className="glass-input"
                value={landCategory}
                onChange={(e) => setLandCategory(e.target.value)}
              >
                <option value="State Land">State Land</option>
                <option value="Commercial Farmland">Commercial Farmland (A2 Scheme)</option>
                <option value="Resettlement Area">Resettlement Area (A1 Scheme)</option>
                <option value="Municipal Council Land">Municipal Council Land</option>
                <option value="Communal Land">Communal Land (Trust Land)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button onClick={() => setCurrentStep(2)} className="btn btn-primary">
              Continue to Step 2 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Agro-Ecological Attributes */}
      {currentStep === 2 && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Step 2: Agro-Ecological & Physical Attributes</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Natural Region (Agro-Ecological Classification) *
              </label>
              <select
                className="glass-input"
                value={naturalRegion}
                onChange={(e) => setNaturalRegion(e.target.value as NaturalRegion)}
              >
                <option value={NaturalRegion.I}>Region I — High rainfall (over 1000mm), specialised &amp; diversified</option>
                <option value={NaturalRegion.II}>Region II — Intensive cropping (750-1000mm rainfall)</option>
                <option value={NaturalRegion.III}>Region III — Semi-intensive, drought-resistant crops</option>
                <option value={NaturalRegion.IV}>Region IV — Semi-extensive livestock & drought feed</option>
                <option value={NaturalRegion.V}>Region V — Extensive ranching or irrigation-only</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Soil Classification *
              </label>
              <select
                className="glass-input"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as SoilType)}
              >
                <option value={SoilType.LOAM}>Rich Loam (Fertile Arable)</option>
                <option value={SoilType.CLAY}>Red Clay / Black Cotton</option>
                <option value={SoilType.SANDY}>Sandy Veldt</option>
                <option value={SoilType.SILT}>Alluvial Silt</option>
                <option value={SoilType.MIXED}>Mixed Granitic / Sandy Loam</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Water Sources (comma-separated)
              </label>
              <input
                type="text"
                className="glass-input"
                value={waterSources}
                onChange={(e) => setWaterSources(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Terrain Topography
              </label>
              <input
                type="text"
                className="glass-input"
                value={terrain}
                onChange={(e) => setTerrain(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={roadAccess}
                  onChange={(e) => setRoadAccess(e.target.checked)}
                />
                All-weather Road Access
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={electricityAccess}
                  onChange={(e) => setElectricityAccess(e.target.checked)}
                />
                Grid Electricity On-Site
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Grid Proximity (km)
              </label>
              <input
                type="number"
                step="0.1"
                className="glass-input"
                value={gridProximityKm}
                onChange={(e) => setGridProximityKm(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Permitted Lease Activities (comma-separated)
              </label>
              <input
                type="text"
                className="glass-input"
                value={permittedUses}
                onChange={(e) => setPermittedUses(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button onClick={() => setCurrentStep(1)} className="btn btn-outline">
              ← Back to Step 1
            </button>
            <button onClick={() => setCurrentStep(3)} className="btn btn-primary">
              Continue to Step 3 (Boundary Editor) →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Spatial Boundary Builder & Overlap Check */}
      {currentStep === 3 && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Step 3: Cadastral Boundary & Overlap Detection</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Input WGS84 GeoJSON polygon coordinates. SLLAS automatically calculates polygon area in hectares, determines centroid, and validates against conflicting cadastral allocations.
            </p>
          </div>

          {/* Quick Presets Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Load Provincial Boundary Presets:</span>
            {Object.entries(SAMPLE_BOUNDARIES).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleApplyPreset(key)}
                className="btn btn-outline"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.6875rem',
                  borderColor: key === 'overlapping_conflict' ? 'rgba(239, 68, 68, 0.5)' : undefined,
                  color: key === 'overlapping_conflict' ? '#fca5a5' : undefined,
                }}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Left: Coordinate Editor & Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  GeoJSON Polygon Coordinates [ [lng, lat], ... ]
                </label>
                <textarea
                  className="glass-input"
                  rows={8}
                  value={rawCoordsText}
                  onChange={(e) => handleCoordsChange(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: '1.4' }}
                />
              </div>

              {/* Spatial Calculations Box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(15, 23, 42, 0.7)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Computed Cadastral Area</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                    {computedArea} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ha</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Calculated Centroid</div>
                  <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                    {computedCentroid.lat}° S, {computedCentroid.lng}° E
                  </div>
                </div>
              </div>

              {/* Real-Time Cadastral Overlap Alert */}
              {overlappingParcel ? (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fca5a5', fontSize: '0.875rem' }}>
                      CADASTRAL OVERLAP CONFLICT DETECTED
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fecaca', marginTop: '2px' }}>
                      Boundary intersects with registered parcel <strong>{overlappingParcel.referenceNumber} ({overlappingParcel.name})</strong> in {overlappingParcel.district}. Under statutory regulations, overlapping allocations cannot be registered.
                    </div>
                  </div>
                </div>
              ) : validationErrors.length > 0 ? (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  fontSize: '0.75rem',
                  color: '#fde047'
                }}>
                  ⚠️ {validationErrors[0]}
                </div>
              ) : (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  fontSize: '0.75rem',
                  color: '#86efac',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>✓</span>
                  <span>Geometry verified valid. Zero boundary overlaps detected across {parcels.length} registered parcels.</span>
                </div>
              )}
            </div>

            {/* Right: Live Spatial Map Visualizer */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Spatial Boundary Map Preview
              </div>
              <SpatialMap
                parcels={parcels}
                highlightPolygon={boundaryCoords}
                height={320}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button onClick={() => setCurrentStep(2)} className="btn btn-outline">
              ← Back to Step 2
            </button>
            <button onClick={() => setCurrentStep(4)} className="btn btn-primary">
              Review and Submit →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Summary & Submit */}
      {currentStep === 4 && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Step 4: Cadastral Dossier Review</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Please review all parcel attributes before saving. Parcels submitted for verification enter the Segregation of Duties queue.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Reference Number</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>{referenceNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Parcel Name</div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>{name || `Parcel ${referenceNumber}`}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Jurisdiction</div>
              <div style={{ fontWeight: 500 }}>{district}, {province} ({ward})</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Calculated Size</div>
              <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#ffffff' }}>{computedArea} ha</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Agro-Ecological Region</div>
              <div>Region {naturalRegion}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Soil & Water</div>
              <div>{soilType} • {waterSources}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Road & Electricity</div>
              <div>{roadAccess ? 'Road Accessible' : 'No Road'} • {electricityAccess ? 'Grid Connected' : `Grid ${gridProximityKm}km`}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Cadastral Overlap Status</div>
              <div style={{ color: overlappingParcel ? '#fca5a5' : '#86efac', fontWeight: 600 }}>
                {overlappingParcel ? 'CONFLICT DETECTED' : 'CLEAN — NO CONFLICT'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <button onClick={() => setCurrentStep(3)} className="btn btn-outline">
              ← Edit Boundary
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleSubmit(ParcelStatus.DRAFT)}
                className="btn btn-outline"
                disabled={Boolean(overlappingParcel) || validationErrors.length > 0}
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSubmit(ParcelStatus.PENDING_VERIFICATION)}
                className="btn btn-primary"
                disabled={Boolean(overlappingParcel) || validationErrors.length > 0}
              >
                Submit for Verification →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
