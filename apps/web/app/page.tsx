'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from './components/AppContext';
import { SpatialMap } from './components/SpatialMap';
import { ZIMBABWE_PROVINCES } from './lib/parcel-data';
import { ParcelStatus } from '@sllas/contracts';

export default function DashboardPage() {
  const { parcels } = useApp();

  const totalHectares = parcels.reduce((sum, p) => sum + p.areaHectares, 0);
  const availableParcels = parcels.filter(p => p.status === ParcelStatus.AVAILABLE);
  const availableHectares = availableParcels.reduce((sum, p) => sum + p.areaHectares, 0);
  const pendingParcels = parcels.filter(p => p.status === ParcelStatus.PENDING_VERIFICATION);
  const leasedParcels = parcels.filter(p => p.status === ParcelStatus.LEASED || p.status === ParcelStatus.ALLOCATED);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner / Welcome */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(22, 163, 74, 0.2)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(22, 163, 74, 0.3)'
            }}>
              PHASE 2 • LAND REGISTRY
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              National Cadastre & Spatial Intelligence
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Executive Land Registry Console
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '640px' }}>
            Official portal for registering, auditing, and allocating state and commercial idle land across Zimbabwe's 10 administrative provinces.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/parcels/new" className="btn btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Register Parcel
          </Link>
          <Link href="/parcels/verify" className="btn btn-accent">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Verification Queue ({pendingParcels.length})
          </Link>
          <Link href="/parcels/bulk-import" className="btn btn-outline">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Bulk Import
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stat-grid">
        <div className="glass-panel stat-card">
          <div className="stat-label">Total Registered Parcels</div>
          <div className="stat-value">{parcels.length}</div>
          <div className="stat-trend">
            <span>↑ Active Cadastre across 10 Provinces</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
          <div className="stat-label">Available Idle Land</div>
          <div className="stat-value" style={{ color: 'var(--primary-400)' }}>
            {availableHectares.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>ha</span>
          </div>
          <div className="stat-trend" style={{ color: 'var(--primary-400)' }}>
            <span>{availableParcels.length} parcels verified & open for lease</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderColor: pendingParcels.length > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined }}>
          <div className="stat-label">Pending Verification</div>
          <div className="stat-value" style={{ color: 'var(--accent-400)' }}>
            {pendingParcels.length}
          </div>
          <div className="stat-trend" style={{ color: 'var(--accent-400)' }}>
            <span>Segregation of Duties Review Required</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Total Tracked Area</div>
          <div className="stat-value">
            {totalHectares.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>ha</span>
          </div>
          <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
            <span>Includes State, Council & Resettlement</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Spatial Map & Provincial Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Spatial Map Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>National Cadastral Map View</h2>
            <Link href="/parcels" style={{ fontSize: '0.8125rem', color: 'var(--primary-400)', textDecoration: 'none' }}>
              Open Spatial Explorer →
            </Link>
          </div>
          <SpatialMap parcels={parcels} height={460} />
        </div>

        {/* Provincial Distribution Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Provincial Inventory</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Zimbabwe Survey Cadastre</span>
          </div>

          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '460px', overflowY: 'auto' }}>
            {ZIMBABWE_PROVINCES.map(prov => {
              const liveProvParcels = parcels.filter(p => p.province.toLowerCase().includes(prov.name.toLowerCase()));
              const liveHa = liveProvParcels.reduce((acc, p) => acc + p.areaHectares, 0);

              return (
                <div
                  key={prov.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#ffffff' }}>{prov.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {liveProvParcels.length} Registered Parcels • {liveHa > 0 ? liveHa : prov.idleHectares} ha
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                      {(prov.availableHectares).toLocaleString()} ha
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Available</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Parcels Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Recently Registered Land Parcels</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest additions to the national cadastre</div>
          </div>
          <Link href="/parcels" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
            View All ({parcels.length})
          </Link>
        </div>

        <div className="glass-panel data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Parcel Name & Location</th>
                <th>Category</th>
                <th>Size</th>
                <th>Natural Region</th>
                <th>Status</th>
                <th>Registrar</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parcels.slice(0, 5).map(parcel => (
                <tr key={parcel.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-400)' }}>
                    {parcel.referenceNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#ffffff' }}>{parcel.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{parcel.district}, {parcel.province}</div>
                  </td>
                  <td>{parcel.landCategory}</td>
                  <td><strong>{parcel.areaHectares}</strong> ha</td>
                  <td>Region {parcel.naturalRegion}</td>
                  <td>
                    <span className={`badge badge-${parcel.status.toLowerCase().replace('_', '-')}`}>
                      {parcel.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8125rem' }}>{parcel.registeredByUserName}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
                      {new Date(parcel.registeredAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <Link href={`/parcels/${parcel.id}`} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
