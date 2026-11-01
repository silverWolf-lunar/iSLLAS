'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useApp } from '../components/AppContext';
import { ParcelRecord } from '../lib/parcel-data';
import { ParcelStatus, NaturalRegion, Role, LeaseClassification } from '@sllas/contracts';
import { ApplyForParcelModal } from '../components/ApplyForParcelModal';

const SpatialMap = dynamic(
  () => import('../components/SpatialMap').then(module => module.SpatialMap),
  { ssr: false, loading: () => <div className="glass-panel map-loading">Loading spatial map…</div> },
);

export default function ParcelsExplorerPage() {
  const { parcels, provinces, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedClassification, setSelectedClassification] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [selectedParcel, setSelectedParcel] = useState<ParcelRecord | null>(null);
  const [applyingParcel, setApplyingParcel] = useState<ParcelRecord | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get('status');
      const viewParam = params.get('view');
      const parcelIdParam = params.get('parcelId');
      const classParam = params.get('classification');

      if (statusParam) setSelectedStatus(statusParam);
      if (classParam) setSelectedClassification(classParam);
      if (viewParam === 'map') setViewMode('map');
      if (parcelIdParam) {
        const found = parcels.find(p => p.id === parcelIdParam);
        if (found) setSelectedParcel(found);
      }
    }
  }, [parcels]);

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

      const matchesClassification = selectedClassification === '' ||
        p.leaseClassification.code === selectedClassification;

      return matchesSearch && matchesProvince && matchesStatus && matchesRegion && matchesClassification;
    });
  }, [parcels, searchTerm, selectedProvince, selectedStatus, selectedRegion, selectedClassification]);

  const handleExportCSV = () => {
    const headers = ['Reference', 'Name', 'Province', 'District', 'Ward', 'Category', 'Hectares', 'Status', 'LeaseClassification', 'StatutoryAct', 'TermYears', 'Bankability', 'NaturalRegion', 'SoilType'];
    const rows = filteredParcels.map(p => [
      p.referenceNumber,
      `"${p.name}"`,
      p.province,
      p.district,
      p.ward,
      p.landCategory,
      p.areaHectares,
      p.status,
      `"${p.leaseClassification.fullName}"`,
      `"${p.leaseClassification.statutoryAct}"`,
      p.leaseClassification.termYears,
      `"${p.leaseClassification.bankability}"`,
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
    <div className="page-stack parcels-explorer">
      {/* Header & Controls */}
      <div className="explorer-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#ffffff' }}>Land Parcels Cadastre & Spatial Explorer</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Search, filter, and inspect registered land parcels with boundary polygons and agro-ecological characteristics.
          </p>
        </div>

        <div className="explorer-actions">
          {/* View Toggle */}
          <div className="view-toggle" style={{
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
          {currentUser?.role !== Role.CLIENT && (
            <Link href="/parcels/new" className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
              + Register Parcel
            </Link>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel filter-bar">
        <div className="filter-search">
          <input
            type="text"
            className="glass-input"
            placeholder="Search by reference, name, district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <select
            className="glass-input"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
          >
            <option value="">All Provinces (10)</option>
            {provinces.map(p => (
              <option key={p.code} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
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

        <div>
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

        <div>
          <select
            className="glass-input"
            value={selectedClassification}
            onChange={(e) => setSelectedClassification(e.target.value)}
          >
            <option value="">All Lease Classifications</option>
            <option value={LeaseClassification.A2_COMMERCIAL}>A2 Commercial Agricultural (99-Year Bankable)</option>
            <option value={LeaseClassification.A1_SETTLEMENT}>A1 Smallholder Permit / Lease</option>
            <option value={LeaseClassification.PERI_URBAN_COMMERCIAL}>Peri-Urban Commercial Agro-Plot</option>
            <option value={LeaseClassification.RANGELAND_PASTORAL}>Extensive Rangeland Pastoral Lease</option>
            <option value={LeaseClassification.AGRO_INDUSTRIAL}>Specialized Agro-Industrial Concession</option>
          </select>
        </div>

        {(searchTerm || selectedProvince || selectedStatus || selectedRegion || selectedClassification) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedProvince('');
              setSelectedStatus('');
              setSelectedRegion('');
              setSelectedClassification('');
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
        <div className={`map-layout${selectedParcel ? ' has-selection' : ''}`}>
          <SpatialMap
            parcels={filteredParcels}
            selectedParcelId={selectedParcel?.id}
            onSelectParcel={(p) => setSelectedParcel(p)}
            onSelectProvince={(province) => setSelectedProvince(province)}
            height={600}
          />

          {selectedParcel && (
            <div className="glass-panel parcel-detail-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }}>
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

              {/* Statutory Lease Classification Card */}
              <div style={{
                background: selectedParcel.leaseClassification.bgColor,
                border: `1px solid ${selectedParcel.leaseClassification.borderColor}`,
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: selectedParcel.leaseClassification.color, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>📜</span> Statutory Lease Classification
                  </span>
                  <span style={{ fontSize: '0.6875rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.4)', color: selectedParcel.leaseClassification.color, fontWeight: 700 }}>
                    {selectedParcel.leaseClassification.termLabel}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#ffffff' }}>
                  {selectedParcel.leaseClassification.fullName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: '#cbd5e1' }}>Act:</strong> {selectedParcel.leaseClassification.statutoryAct}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: '#cbd5e1' }}>Security:</strong> {selectedParcel.leaseClassification.bankability}
                </div>
              </div>

              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
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
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Centroid (WGS84)</div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {selectedParcel.centroid.lat.toFixed(5)}, {selectedParcel.centroid.lng.toFixed(5)}
                  </div>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                {selectedParcel.status === ParcelStatus.AVAILABLE && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      background: 'var(--primary-600)',
                      borderColor: 'var(--primary-400)',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      padding: '10px',
                    }}
                    onClick={() => setApplyingParcel(selectedParcel)}
                  >
                    🌱 Apply for {selectedParcel.leaseClassification.shortName}
                  </button>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/parcels/${selectedParcel.id}`} className="btn btn-outline" style={{ flex: 1, fontSize: '0.8125rem' }}>
                    Open Full Dossier →
                  </Link>
                  {selectedParcel.status === ParcelStatus.PENDING_VERIFICATION && (
                    <Link href={`/parcels/verify`} className="btn btn-accent" style={{ fontSize: '0.8125rem' }}>
                      Verify
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
        <div className="glass-panel data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Parcel Name</th>
                <th>Province & District</th>
                <th>Tenure</th>
                <th>Lease Classification</th>
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
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
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
                    <td>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: parcel.leaseClassification.color,
                        background: parcel.leaseClassification.bgColor,
                        border: `1px solid ${parcel.leaseClassification.borderColor}`,
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{ fontSize: '0.5rem' }}>●</span>
                        <span>{parcel.leaseClassification.shortName}</span>
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {parcel.leaseClassification.termYears}-Yr Leasehold
                      </div>
                    </td>
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
                        {parcel.status === ParcelStatus.AVAILABLE && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--primary-600)' }}
                            onClick={() => setApplyingParcel(parcel)}
                          >
                            Apply
                          </button>
                        )}
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
        <div className="parcel-card-list">
          {filteredParcels.length === 0
            ? <div className="empty-state">No parcels match the selected search criteria.</div>
            : filteredParcels.map(parcel => (
              <article className="parcel-card" key={parcel.id}>
                <div className="parcel-card-heading">
                  <span className="parcel-reference">{parcel.referenceNumber}</span>
                  <span className={`badge badge-${parcel.status.toLowerCase().replace('_', '-')}`}>{parcel.status}</span>
                </div>
                <div style={{ marginTop: '4px', marginBottom: '6px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: parcel.leaseClassification.color,
                    background: parcel.leaseClassification.bgColor,
                    border: `1px solid ${parcel.leaseClassification.borderColor}`
                  }}>
                    📜 {parcel.leaseClassification.shortName}
                  </span>
                </div>
                <h3>{parcel.name}</h3>
                <p>{parcel.province} · {parcel.district}</p>
                <div className="parcel-card-meta"><span>{parcel.areaHectares} ha</span><span>Region {parcel.naturalRegion}</span></div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <Link href={`/parcels/${parcel.id}`} className="btn btn-outline" style={{ flex: 1 }}>View parcel</Link>
                  {parcel.status === ParcelStatus.AVAILABLE && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ background: 'var(--primary-600)' }}
                      onClick={() => setApplyingParcel(parcel)}
                    >
                      Apply
                    </button>
                  )}
                </div>
              </article>
            ))}
        </div>
        </>
      )}

      {applyingParcel && (
        <ApplyForParcelModal
          parcel={applyingParcel}
          isOpen={!!applyingParcel}
          onClose={() => setApplyingParcel(null)}
        />
      )}
    </div>
  );
}
