'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../components/AppContext';

export default function BulkImportPage() {
  const router = useRouter();
  const { bulkImportParcels } = useApp();
  const [rawPayload, setRawPayload] = useState('');
  const [message, setMessage] = useState('');

  const validate = () => {
    try {
      const payload = JSON.parse(rawPayload);
      const rows = payload.type === 'FeatureCollection' ? payload.features : payload;
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Provide a non-empty GeoJSON FeatureCollection or parcel array.');
      }
      setMessage(`${rows.length} records parsed. Submit through the authenticated API workflow to persist them.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid JSON payload');
    }
  };

  const importRows = () => {
    try {
      const payload = JSON.parse(rawPayload);
      const rows = payload.type === 'FeatureCollection' ? payload.features : payload;
      const result = bulkImportParcels(rows);
      setMessage(`Imported ${result.imported}; rejected ${result.failed}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid JSON payload');
    }
  };

  return (
    <div className="page-stack bulk-import-page">
      <div>
        <h1 style={{ color: '#fff' }}>Bulk Parcel Import</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Paste an approved GeoJSON FeatureCollection or API parcel payload. No sample records are preloaded.
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
        <button className="btn btn-outline" onClick={validate}>Validate payload</button>
        <button className="btn btn-primary" onClick={importRows}>Submit import</button>
        <button className="btn btn-outline" onClick={() => router.push('/parcels')}>Back to parcels</button>
      </div>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
