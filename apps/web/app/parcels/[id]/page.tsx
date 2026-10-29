'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp } from '../../components/AppContext';
import { ParcelStatus } from '@sllas/contracts';
import { ApplyForParcelModal } from '../../components/ApplyForParcelModal';

const SpatialMap = dynamic(
  () => import('../../components/SpatialMap').then(module => module.SpatialMap),
  { ssr: false, loading: () => <div className="glass-panel" style={{ height: 360, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>Loading spatial map…</div> },
);

export default function ParcelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { parcels, updateParcelStatus } = useApp();

  const parcelId = params?.id as string;
  const parcel = parcels.find(p => p.id === parcelId);

  const [activeTab, setActiveTab] = useState<'overview' | 'geometry' | 'audit'>('overview');
  const [showApplyModal, setShowApplyModal] = useState(false);

  if (!parcel) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '8px' }}>Parcel Record Not Found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
          No cadastral record matches ID: <code>{parcelId}</code>.
        </p>
        <Link href="/parcels" className="btn btn-primary">
          ← Back to Parcel Explorer
        </Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus: ParcelStatus) => {
    updateParcelStatus(parcel.id, newStatus);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
        <Link href="/parcels" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Parcels Cadastre
        </Link>
        <span style={{ color: 'var(--text-dim)' }}>/</span>
        <span style={{ color: 'var(--primary-400)', fontFamily: 'var(--font-mono)' }}>
          {parcel.referenceNumber}
        </span>
      </div>

      {/* Hero Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--primary-400)', fontWeight: 600 }}>
              {parcel.referenceNumber}
            </span>
            <span className={`badge badge-${parcel.status.toLowerCase().replace('_', '-')}`}>
              {parcel.status}
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff', marginBottom: '4px' }}>
            {parcel.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {parcel.district}, {parcel.province} Province • {parcel.ward} • {parcel.landCategory}
          </p>
        </div>

        {/* Action Controls based on Status */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {parcel.status === ParcelStatus.DRAFT && (
            <button
              onClick={() => handleStatusChange(ParcelStatus.PENDING_VERIFICATION)}
              className="btn btn-primary"
            >
              Submit for Verification →
            </button>
          )}

          {parcel.status === ParcelStatus.PENDING_VERIFICATION && (
            <Link href="/parcels/verify" className="btn btn-accent">
              Open in Verification Workbench →
            </Link>
          )}

          {parcel.status === ParcelStatus.AVAILABLE && (
            <>
              <button
                type="button"
                onClick={() => setShowApplyModal(true)}
                className="btn btn-primary"
                style={{ background: 'var(--primary-600)', borderColor: 'var(--primary-400)', fontWeight: 700 }}
              >
                🌱 Apply for This Land Parcel
              </button>
              <button
                onClick={() => handleStatusChange(ParcelStatus.RESERVED)}
                className="btn btn-outline"
                style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
              >
                Mark Reserved
              </button>
              <button
                onClick={() => handleStatusChange(ParcelStatus.ALLOCATED)}
                className="btn btn-outline"
                style={{ borderColor: 'rgba(249, 115, 22, 0.4)', color: '#fdba74' }}
              >
                Allocate Lease
              </button>
            </>
          )}

          <button
            onClick={() => handleStatusChange(ParcelStatus.WITHDRAWN)}
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}
          >
            Withdraw Parcel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        {[
          { key: 'overview', label: 'Cadastral & Agro Overview' },
          { key: 'geometry', label: 'PostGIS Spatial Boundary' },
          { key: 'audit', label: 'Audit Trail & Verification' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              background: activeTab === tab.key ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
              border: activeTab === tab.key ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid transparent',
              color: activeTab === tab.key ? 'var(--primary-400)' : 'var(--text-muted)',
              borderRadius: '6px',
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          {/* Left Attributes */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Land Characteristics Dossier</h2>

            <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Cadastral Area</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
                  {parcel.areaHectares} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ha</span>
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Tenure Category</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-300)' }}>
                  {parcel.landCategory}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Agro-Ecological Region</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-400)' }}>
                  Region {parcel.naturalRegion}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Soil Classification</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>
                  {parcel.soilType}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Water Sources & Hydrology</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {parcel.waterSources.map((ws, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.15)', color: '#7dd3fc', border: '1px solid rgba(14, 165, 233, 0.3)', fontSize: '0.75rem' }}>
                    💧 {ws}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Infrastructure & Logistics</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '6px', background: parcel.roadAccess ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: parcel.roadAccess ? '#86efac' : '#fca5a5', border: '1px solid var(--border-card)', fontSize: '0.75rem' }}>
                  {parcel.roadAccess ? '✓ All-Weather Road Accessible' : '✕ No Road Access'}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: '6px', background: parcel.electricityAccess ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)', color: parcel.electricityAccess ? '#fde047' : '#cbd5e1', border: '1px solid var(--border-card)', fontSize: '0.75rem' }}>
                  {parcel.electricityAccess ? '⚡ Grid Connected' : `⚡ Grid Proximity: ${parcel.gridProximityKm}km`}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Permitted Activities for Lease</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {parcel.permittedUses.map((use, i) => (
                  <span key={i} style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                    {use}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Cadastral Boundary Map
            </div>
            <SpatialMap
              parcels={[parcel]}
              selectedParcelId={parcel.id}
              height={420}
            />
          </div>
        </div>
      )}

      {/* Tab: Geometry */}
      {activeTab === 'geometry' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>PostGIS Spatial Representation (SRID 4326)</h2>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Centroid Coordinates
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                Latitude: <strong>{parcel.centroid.lat}°</strong> | Longitude: <strong>{parcel.centroid.lng}°</strong>
              </div>

              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', margin: '16px 0 8px' }}>
                Boundary Vertices (WGS84 Lon, Lat)
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vertex #</th>
                      <th>Longitude (E)</th>
                      <th>Latitude (S)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcel.boundary.coordinates[0].map((coord, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{idx + 1}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>{coord[0]}°</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-400)' }}>{coord[1]}°</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Raw GeoJSON Representation
              </div>
              <pre style={{
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '16px',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--primary-300)',
                maxHeight: '340px',
                overflowY: 'auto'
              }}>
                {JSON.stringify(parcel.boundary, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Audit */}
      {activeTab === 'audit' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Append-Only Cadastral Audit Log</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Full chronological lineage of registration, boundary surveying, and officer verification actions.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            {/* Event 1: Registration */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}>
                +
              </div>
              <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>
                    Parcel Initial Registration Completed
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {new Date(parcel.registeredAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Recorded by <strong>{parcel.registeredByUserName}</strong> (User ID: {parcel.registeredByUserId})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Boundary polygon ingested with calculated area of {parcel.areaHectares} ha. Initial status: {ParcelStatus.PENDING_VERIFICATION}.
                </div>
              </div>
            </div>

            {/* Event 2: Verification (if present) */}
            {parcel.verification && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(217, 119, 6, 0.2)',
                  color: 'var(--accent-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}>
                  ⚖️
                </div>
                <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-400)', fontSize: '0.875rem' }}>
                      Two-Officer Segregation Review: {parcel.verification.decision}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(parcel.verification.verifiedAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Verified by <strong>{parcel.verification.verifiedByUserName}</strong> (User ID: {parcel.verification.verifiedByUserId})
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', marginTop: '8px', padding: '8px 12px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '6px' }}>
                    "{parcel.verification.notes}"
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showApplyModal && (
        <ApplyForParcelModal
          parcel={parcel}
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
        />
      )}
    </div>
  );
}
