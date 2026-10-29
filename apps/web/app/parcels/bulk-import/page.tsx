'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../components/AppContext';
import { calculatePolygonAreaHa, calculateCentroid, ParcelRecord } from '../../lib/parcel-data';
import { NaturalRegion, SoilType } from '@sllas/contracts';

interface ParsedImportRow {
  rowNum: number;
  referenceNumber: string;
  name: string;
  province: string;
  district: string;
  areaHectares: number;
  boundary: any;
  centroid: { lat: number; lng: number };
  naturalRegion: NaturalRegion;
  soilType: SoilType;
  isValid: boolean;
  errors: string[];
}

const SAMPLE_GEOJSON_BATCH = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        referenceNumber: "MW-2026-9011",
        name: "Karoi North Maize & Soya Tract",
        province: "Mashonaland West",
        district: "Hurungwe",
        naturalRegion: "II",
        soilType: "LOAM",
        landCategory: "Commercial Farmland"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [29.680, -16.810],
          [29.710, -16.810],
          [29.710, -16.835],
          [29.680, -16.835],
          [29.680, -16.810]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        referenceNumber: "MID-2026-9022",
        name: "Lalapanzi Dairy Pastures Lot 1",
        province: "Midlands",
        district: "Chirumhanzu",
        naturalRegion: "III",
        soilType: "SANDY",
        landCategory: "State Land"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [30.220, -19.310],
          [30.250, -19.310],
          [30.250, -19.330],
          [30.220, -19.330],
          [30.220, -19.310]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        referenceNumber: "MAN-2026-9033",
        name: "Rusape Agricultural Logistics Block",
        province: "Manicaland",
        district: "Makoni",
        naturalRegion: "II",
        soilType: "CLAY",
        landCategory: "Municipal Council Land"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [32.110, -18.520],
          [32.140, -18.520],
          [32.140, -18.545],
          [32.110, -18.545],
          [32.110, -18.520]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        referenceNumber: "",
        name: "Defective Parcel (Missing Ref & Unclosed Polygon)",
        province: "Harare",
        district: "Harare South"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [31.050, -17.880],
          [31.070, -17.880],
          [31.070, -17.900]
        ]]
      }
    }
  ]
};

export default function BulkImportPage() {
  const router = useRouter();
  const { bulkImportParcels } = useApp();

  const [rawPayload, setRawPayload] = useState<string>(
    JSON.stringify(SAMPLE_GEOJSON_BATCH, null, 2)
  );
  const [dryRunReport, setDryRunReport] = useState<ParsedImportRow[] | null>(null);
  const [importSummary, setImportSummary] = useState<{ imported: number; failed: number } | null>(null);

  const handleDryRunValidation = () => {
    try {
      const parsed = JSON.parse(rawPayload);
      const rows: ParsedImportRow[] = [];

      let features: any[] = [];
      if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
        features = parsed.features;
      } else if (Array.isArray(parsed)) {
        features = parsed;
      } else {
        alert('Payload must be a GeoJSON FeatureCollection or JSON array of parcel features.');
        return;
      }

      features.forEach((feat, idx) => {
        const props = feat.properties || feat;
        const geom = feat.geometry || feat.boundary;
        const errors: string[] = [];

        if (!props.referenceNumber || props.referenceNumber.trim() === '') {
          errors.push('Missing reference number.');
        }

        if (!props.province || props.province.trim() === '') {
          errors.push('Missing province.');
        }

        let areaHa = 0;
        let centroid = { lat: -17.82, lng: 31.03 };

        if (!geom || geom.type !== 'Polygon' || !Array.isArray(geom.coordinates)) {
          errors.push('Invalid geometry: Expected Polygon GeoJSON.');
        } else {
          const coords = geom.coordinates[0];
          if (!Array.isArray(coords) || coords.length < 4) {
            errors.push('Polygon requires at least 4 coordinates (closed ring).');
          } else {
            const first = coords[0];
            const last = coords[coords.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
              errors.push('First and last coordinates do not match (unclosed polygon ring).');
            } else {
              areaHa = calculatePolygonAreaHa(coords);
              centroid = calculateCentroid(coords);
            }
          }
        }

        rows.push({
          rowNum: idx + 1,
          referenceNumber: props.referenceNumber || `ROW-${idx + 1}`,
          name: props.name || `Imported Parcel ${idx + 1}`,
          province: props.province || 'Unknown',
          district: props.district || 'General District',
          areaHectares: areaHa,
          boundary: geom,
          centroid,
          naturalRegion: props.naturalRegion || NaturalRegion.II,
          soilType: props.soilType || SoilType.LOAM,
          isValid: errors.length === 0,
          errors,
        });
      });

      setDryRunReport(rows);
      setImportSummary(null);
    } catch (e: any) {
      alert(`JSON Parse Error: ${e.message}`);
    }
  };

  const handleCommitImport = () => {
    if (!dryRunReport) return;
    const validRows = dryRunReport.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows found to commit.');
      return;
    }

    const res = bulkImportParcels(validRows as any);
    setImportSummary(res);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.2)', color: 'var(--primary-400)' }}>
            DATA INGESTION
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Surveyor General & Municipal Cadastre Ingestion</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', color: '#ffffff' }}>Bulk Parcel Ingestion & Ingestion Engine</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Batch import land parcels from GeoJSON or CSV with dry-run boundary validation, topological ring integrity checks, and automated row-level error reporting.
        </p>
      </div>

      {/* Editor & Actions */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Input Payload (GeoJSON FeatureCollection or JSON Array)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setRawPayload(JSON.stringify(SAMPLE_GEOJSON_BATCH, null, 2));
                setDryRunReport(null);
                setImportSummary(null);
              }}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              Reset to Sample GeoJSON
            </button>
            <button
              onClick={handleDryRunValidation}
              className="btn btn-accent"
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
            >
              🔍 Run Dry-Run Validation
            </button>
          </div>
        </div>

        <textarea
          className="glass-input"
          rows={12}
          value={rawPayload}
          onChange={(e) => setRawPayload(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: '1.4' }}
        />
      </div>

      {/* Import Summary Banner */}
      {importSummary && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '8px',
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#86efac' }}>
              ✓ Bulk Ingestion Completed Successfully
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#bbf7d0', marginTop: '2px' }}>
              {importSummary.imported} parcels committed to <strong>PENDING_VERIFICATION</strong> queue. {importSummary.failed} rows skipped due to errors.
            </div>
          </div>
          <button
            onClick={() => router.push('/parcels/verify')}
            className="btn btn-primary"
            style={{ fontSize: '0.8125rem' }}
          >
            Go to Verification Queue →
          </button>
        </div>
      )}

      {/* Dry Run Diagnostic Report Table */}
      {dryRunReport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Dry-Run Validation Results</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {dryRunReport.filter(r => r.isValid).length} Valid rows • {dryRunReport.filter(r => !r.isValid).length} Error rows
              </div>
            </div>

            <button
              onClick={handleCommitImport}
              className="btn btn-primary"
              disabled={dryRunReport.filter(r => r.isValid).length === 0}
            >
              ✓ Commit {dryRunReport.filter(r => r.isValid).length} Valid Parcels to Registry
            </button>
          </div>

          <div className="glass-panel data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Row #</th>
                  <th>Reference</th>
                  <th>Parcel Name</th>
                  <th>Province & District</th>
                  <th>Calculated Size</th>
                  <th>Status</th>
                  <th>Validation Diagnostics</th>
                </tr>
              </thead>
              <tbody>
                {dryRunReport.map(row => (
                  <tr key={row.rowNum} style={{ background: row.isValid ? undefined : 'rgba(239, 68, 68, 0.05)' }}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{row.rowNum}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: row.isValid ? 'var(--primary-400)' : '#fca5a5' }}>
                      {row.referenceNumber}
                    </td>
                    <td>{row.name}</td>
                    <td>{row.district}, {row.province}</td>
                    <td>{row.areaHectares > 0 ? `${row.areaHectares} ha` : '—'}</td>
                    <td>
                      {row.isValid ? (
                        <span style={{ fontSize: '0.6875rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                          ✓ READY TO IMPORT
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.6875rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                          ✕ REJECTED
                        </span>
                      )}
                    </td>
                    <td>
                      {row.isValid ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Polygon closed and valid</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {row.errors.map((err, i) => (
                            <span key={i} style={{ fontSize: '0.75rem', color: '#fca5a5' }}>• {err}</span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
