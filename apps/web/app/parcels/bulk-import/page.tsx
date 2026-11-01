'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BulkImportResult, useApp } from '../../components/AppContext';

/**
 * Accepts either a GeoJSON FeatureCollection (feature `properties` carry the
 * parcel fields and `geometry` becomes the boundary) or an array of API parcel
 * payloads (`provinceId`, `districtId`, `landCategoryId`, `boundary`, ...).
 */
function parseRows(rawPayload: string): unknown[] {
  const payload = JSON.parse(rawPayload);
  const rows = payload?.type === 'FeatureCollection' ? payload.features : payload;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Provide a non-empty GeoJSON FeatureCollection or parcel array.');
  }
  return rows.map(row =>
    row?.type === 'Feature' ? { ...(row.properties ?? {}), boundary: row.geometry } : row,
  );
}

export default function BulkImportPage() {
  const router = useRouter();
  const { bulkImportParcels } = useApp();
  const [rawPayload, setRawPayload] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const run = async (dryRun: boolean) => {
    setResult(null);
    let rows: unknown[];
    try {
      rows = parseRows(rawPayload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid JSON payload');
      return;
    }

    setBusy(true);
    setMessage(dryRun ? 'Validating against the registry…' : 'Importing parcels…');
    const outcome = await bulkImportParcels(rows, dryRun);
    setBusy(false);
    setMessage(outcome.message);
    setResult(outcome);
  };

  const rejected = result?.results.filter(row => !row.success) ?? [];

  return (
    <div className="page-stack bulk-import-page">
      <div>
        <h1 style={{ color: '#fff' }}>Bulk Parcel Import</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Paste an approved GeoJSON FeatureCollection or API parcel payload. Use <strong>Validate payload</strong> for a
          dry run against the registry; <strong>Submit import</strong> saves valid rows to the database.
        </p>
      </div>
      <textarea
        className="glass-input"
        rows={18}
        value={rawPayload}
        onChange={(event) => setRawPayload(event.target.value)}
        placeholder="Paste approved parcel data here"
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-outline" onClick={() => run(true)} disabled={busy}>Validate payload</button>
        <button className="btn btn-primary" onClick={() => run(false)} disabled={busy}>Submit import</button>
        <button className="btn btn-outline" onClick={() => router.push('/parcels')}>Back to parcels</button>
      </div>
      {message && (
        <p role="status" style={{ color: result && !result.success ? '#fca5a5' : undefined }}>{message}</p>
      )}
      {rejected.length > 0 && (
        <ul style={{ color: '#fca5a5', fontSize: '0.8125rem', paddingLeft: 18 }}>
          {rejected.slice(0, 20).map(row => (
            <li key={row.index}>Row {row.index + 1}: {row.error ?? 'Rejected'}</li>
          ))}
          {rejected.length > 20 && <li>…and {rejected.length - 20} more rejected rows.</li>}
        </ul>
      )}
    </div>
  );
}
