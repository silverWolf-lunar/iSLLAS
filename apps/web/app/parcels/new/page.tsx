'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp } from '../../components/AppContext';
import {
  calculatePolygonAreaHa,
  calculateCentroid,
  checkBoundingBoxOverlap,
} from '../../lib/parcel-data';
import { ParcelStatus, NaturalRegion, SoilType } from '@sllas/contracts';

const SpatialMap = dynamic(
  () => import('../../components/SpatialMap').then(module => module.SpatialMap),
  { ssr: false, loading: () => <div className="glass-panel" style={{ height: 320, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>Loading spatial map…</div> },
);

export default function NewParcelPage() {
  const router = useRouter();
  const { parcels, provinces, addParcel } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [referenceNumber, setReferenceNumber] = useState('');
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [landCategory, setLandCategory] = useState('');
  const [naturalRegion, setNaturalRegion] = useState<NaturalRegion | ''>('');
  const [soilType, setSoilType] = useState<SoilType | ''>('');
  const [waterSources, setWaterSources] = useState('');
  const [roadAccess, setRoadAccess] = useState(false);
  const [electricityAccess, setElectricityAccess] = useState(false);
  const [gridProximityKm, setGridProximityKm] = useState<number | ''>('');
  const [terrain, setTerrain] = useState('');
  const [currentUse, setCurrentUse] = useState('');
  const [permittedUses, setPermittedUses] = useState('');
  const [knownRestrictions, setKnownRestrictions] = useState('');

  // Boundary State
  const [boundaryCoords, setBoundaryCoords] = useState<number[][]>(
    [],
  );
  const [rawCoordsText, setRawCoordsText] = useState(
    '',
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

  // Duplicate Reference Check (Section 4.3.1 Specification)
  const isDuplicateReference = useMemo(() => {
    if (!referenceNumber.trim()) return false;
    return parcels.some(p => p.referenceNumber.toLowerCase() === referenceNumber.trim().toLowerCase());
  }, [referenceNumber, parcels]);

  // Real-time overlap check against existing active parcels
  const overlappingParcel = useMemo(() => {
    if (validationErrors.length > 0) return null;
    return parcels.find(p => {
      if (p.status === ParcelStatus.WITHDRAWN) return false;
      return checkBoundingBoxOverlap(boundaryCoords, p.boundary.coordinates[0]);
    });
  }, [boundaryCoords, validationErrors, parcels]);

  const handleApplyPreset = (key: string) => {
    void key;
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
    if (!referenceNumber.trim()) {
      alert('Cannot submit: Parcel Reference Number is mandatory.');
      return;
    }
    if (isDuplicateReference) {
      alert(`Cadastral duplicate conflict: Parcel reference '${referenceNumber}' is already registered in the system. Duplicate references are strictly prohibited.`);
      return;
    }
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
      naturalRegion: naturalRegion || null,
      soilType: soilType || null,
      waterSources: waterSources.split(',').map(s => s.trim()).filter(Boolean),
      roadAccess,
      electricityAccess,
      gridProximityKm: gridProximityKm === '' ? null : gridProximityKm,
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
    <div className="page-stack registration-page">
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

          <div className="form-grid mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Parcel Reference Number *
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. ZW-MSW-MAK-2026-0042"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                required
                style={{
                  borderColor: isDuplicateReference ? '#ef4444' : referenceNumber.trim() ? '#22c55e' : undefined
                }}
              />
              {isDuplicateReference && (
                <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
                  ⚠️ Duplicate reference: &apos;{referenceNumber}&apos; already exists in the national cadastre.
                </div>
              )}
              {!isDuplicateReference && referenceNumber.trim() && (
                <div style={{ color: '#4ade80', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                  ✓ Reference is unique and available for registration
                </div>
              )}
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
                {provinces.map(p => (
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

          <div className="form-grid mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
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

          <div className="form-grid mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(15, 23, 42, 0.7)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
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

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '8px' }}>
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
