'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';
import { SpatialMap } from '../components/SpatialMap';
import { ParcelRecord, ZIMBABWE_PROVINCES } from '../lib/parcel-data';
import { ParcelStatus, NaturalRegion } from '@sllas/contracts';

export default function ParcelsExplorerPage() {
  const { parcels } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [selectedParcel, setSelectedParcel] = useState<ParcelRecord | null>(null);

  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      const matchesSearch = searchTerm === '' ||
        p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.district.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProvince = selectedProvince === '' ||
        p.province.toLowerCase() === selectedProvince.toLowerCase();

      const matchesStatus = selectedStatus === '' ||
        p.status === selectedStatus;

      const matchesRegion = selectedRegion === '' ||
        p.naturalRegion === selectedRegion;

      return matchesSearch && matchesProvince && matchesStatus && matchesRegion;
    });
  }, [parcels, searchTerm, selectedProvince, selectedStatus, selectedRegion]);

  const handleExportCSV = () => {
    const headers = ['Reference', 'Name', 'Province', 'District', 'Ward', 'Category', 'Hectares', 'Status', 'NaturalRegion', 'SoilType'];
    const rows = filteredParcels.map(p => [
      p.referenceNumber,
      `"${p.name}"`,
      p.province,
      p.district,
      p.ward,
      p.landCategory,
      p.areaHectares,
      p.status,
      p.naturalRegion,
      p.soilType,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sllas-parcels-cadastre-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#ffffff' }}>Land Parcels Cadastre & Spatial Explorer</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Search, filter, and inspect registered land parcels with boundary polygons and agro-ecological characteristics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* View Toggle */}
          <div style={{
            background: 'var(--bg-input)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--border-card)',
            display: 'flex',
            gap: '2px'
          }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--primary-600)' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('map')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'map' ? 'var(--primary-600)' : 'transparent',
                color: viewMode === 'map' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Spatial Map View
            </button>
          </div>

          <button onClick={handleExportCSV} className="btn btn-outline" style={{ fontSize: '0.75rem' }}>
            Export CSV
          </button>
          <Link href="/parcels/new" className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
            + Register Parcel
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px' }}>
          <input
            type="text"
            className="glass-input"
            placeholder="Search by reference, name, district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <select
            className="glass-input"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
          >
            <option value="">All Provinces (10)</option>
            {ZIMBABWE_PROVINCES.map(p => (
              <option key={p.code} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <select
            className="glass-input"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value={ParcelStatus.AVAILABLE}>AVAILABLE</option>
            <option value={ParcelStatus.PENDING_VERIFICATION}>PENDING VERIFICATION</option>
            <option value={ParcelStatus.DRAFT}>DRAFT</option>
            <option value={ParcelStatus.ALLOCATED}>ALLOCATED</option>
            <option value={ParcelStatus.LEASED}>LEASED</option>
            <option value={ParcelStatus.DISPUTED}>DISPUTED</option>
          </select>
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <select
            className="glass-input"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="">All Agro-Ecological Regions</option>
            <option value={NaturalRegion.I}>Region I (Specialised & Diversified)</option>
            <option value={NaturalRegion.II}>Region II (Intensive Cropping)</option>
            <option value={NaturalRegion.III}>Region III (Semi-Intensive)</option>
            <option value={NaturalRegion.IV}>Region IV (Semi-Extensive)</option>
            <option value={NaturalRegion.V}>Region V (Extensive / Irrigation)</option>
          </select>
        </div>

        {(searchTerm || selectedProvince || selectedStatus || selectedRegion) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedProvince('');
              setSelectedStatus('');
              setSelectedRegion('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main View Display */}
      {viewMode === 'map' ? (
        <div style={{ display: 'grid', gridTemplateColumns: selectedParcel ? '1.5fr 1fr' : '1fr', gap: '20px' }}>
          <SpatialMap
            parcels={filteredParcels}
            selectedParcelId={selectedParcel?.id}
            onSelectParcel={(p) => setSelectedParcel(p)}
            height={600}
          />

          {selectedParcel && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge badge-${selectedParcel.status.toLowerCase().replace('_', '-')}`}>
                  {selectedParcel.status}
                </span>
                <button
                  onClick={() => setSelectedParcel(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1rem' }}
                >
                  ✕
                </button>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>
                  {selectedParcel.referenceNumber}
                </div>
                <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginTop: '4px' }}>
                  {selectedParcel.name}
                </h3>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {selectedParcel.district}, {selectedParcel.province} • {selectedParcel.ward}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Area</div>
                  <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#ffffff' }}>{selectedParcel.areaHectares} ha</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Tenure Category</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#ffffff' }}>{selectedParcel.landCategory}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Natural Region</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--accent-400)' }}>
                    Region {selectedParcel.naturalRegion}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Soil Classification</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#ffffff' }}>{selectedParcel.soilType}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Water & Infrastructure</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedParcel.waterSources.map((ws, i) => (
                    <span key={i} style={{ fontSize: '0.6875rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(14, 165, 233, 0.15)', color: '#7dd3fc', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                      💧 {ws}
                    </span>
                  ))}
                  {selectedParcel.roadAccess && (
                    <span style={{ fontSize: '0.6875rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(74, 222, 128, 0.15)', color: '#86efac', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                      🛣 Road Access
                    </span>
                  )}
                  {selectedParcel.electricityAccess && (
                    <span style={{ fontSize: '0.6875rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fde047', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      ⚡ Grid Access ({selectedParcel.gridProximityKm}km)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Boundary Coordinates (WGS84 SRID 4326)</div>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  color: 'var(--primary-300)',
                  fontFamily: 'var(--font-mono)',
                  maxHeight: '100px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(selectedParcel.boundary.coordinates[0], null, 2)}
                </pre>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <Link href={`/parcels/${selectedParcel.id}`} className="btn btn-primary" style={{ flex: 1, fontSize: '0.8125rem' }}>
                  Open Full Dossier →
                </Link>
                {selectedParcel.status === ParcelStatus.PENDING_VERIFICATION && (
                  <Link href={`/parcels/verify`} className="btn btn-accent" style={{ fontSize: '0.8125rem' }}>
                    Verify
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Parcel Name</th>
                <th>Province & District</th>
                <th>Tenure</th>
                <th>Area</th>
                <th>Natural Region</th>
                <th>Soil</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    No parcels match the selected search criteria.
                  </td>
                </tr>
              ) : (
                filteredParcels.map(parcel => (
                  <tr key={parcel.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-400)' }}>
                      {parcel.referenceNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{parcel.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>{parcel.currentUse}</div>
                    </td>
                    <td>
                      <div>{parcel.province}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{parcel.district} ({parcel.ward})</div>
                    </td>
                    <td>{parcel.landCategory}</td>
                    <td><strong>{parcel.areaHectares}</strong> ha</td>
                    <td>Region {parcel.naturalRegion}</td>
                    <td>{parcel.soilType}</td>
                    <td>
                      <span className={`badge badge-${parcel.status.toLowerCase().replace('_', '-')}`}>
                        {parcel.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link href={`/parcels/${parcel.id}`} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                          Dossier
                        </Link>
                        {parcel.status === ParcelStatus.PENDING_VERIFICATION && (
                          <Link href="/parcels/verify" className="btn btn-accent" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                            Verify
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
