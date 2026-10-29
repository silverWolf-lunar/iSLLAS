'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../components/AppContext';

interface Application {
  id: string;
  applicationNumber: string;
  waitingListNumber?: string;
  status: string;
  provinceId?: string;
  districtId?: string;
  proposedLandUse: string;
  hectaresRequested?: number;
  capitalInvestmentUsd?: number;
  createdAt: string;
  parcel?: {
    id: string;
    referenceNumber: string;
    areaHectares: number;
    provinceId: string;
  };
}

export default function ClientApplicationsPage() {
  const { provinces, parcels } = useApp();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New application form
  const [formData, setFormData] = useState({
    parcelId: '',
    provinceId: '',
    districtId: '',
    proposedLandUse: 'CROPPING',
    hectaresRequested: 50,
    capitalInvestmentUsd: 15000,
    developmentTimelineMonths: 24,
    notes: '',
  });

  const availableParcels = parcels.filter(p => p.status === 'AVAILABLE');

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      setLoading(true);
      const res = await fetch('/api/backend/api/v1/applications/my');
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateApplication(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch('/api/backend/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId: formData.parcelId || undefined,
          provinceId: formData.provinceId || (provinces[0]?.id || 'f1a2b3c4-0001-4000-8000-000000000001'),
          districtId: formData.districtId || undefined,
          proposedLandUse: formData.proposedLandUse,
          hectaresRequested: Number(formData.hectaresRequested),
          capitalInvestmentUsd: Number(formData.capitalInvestmentUsd),
          developmentTimelineMonths: Number(formData.developmentTimelineMonths),
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit application');
      }

      await fetchApplications();
      setShowModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating application');
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ALLOCATED':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: 'var(--primary-400)', border: 'rgba(34, 197, 94, 0.4)' };
      case 'OFFER_ISSUED':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' };
      case 'REJECTED':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-400)', border: 'rgba(245, 158, 11, 0.4)' };
    }
  };

  return (
    <div className="page-stack">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/client" style={{ color: 'var(--primary-400)', fontSize: '0.8125rem' }}>
              ← Client Portal
            </Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Land Applications</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Land Applications & Waiting List
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Every submitted application is securely registered and assigned a statutory Waiting List Number (WL-2026-XXXX).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/parcels?status=AVAILABLE&view=map" className="btn btn-accent">
            🗺️ Select Land Parcel from Map
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Lodge General Application
          </button>
        </div>
      </div>

      {/* Info Panel: Statutory Allocation Policy */}
      <div className="glass-panel" style={{ padding: '16px 20px', background: 'rgba(15, 23, 42, 0.7)' }}>
        <h4 style={{ fontSize: '0.875rem', color: 'var(--primary-400)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏛️</span> National Land Allocation Protocol (Zimbabwe Agricultural Land Settlement Act)
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: '1.4' }}>
          State land parcels are allocated chronologically based on your Waiting List timestamp, technical farming competence, and provincial quota. Once a matching parcel is inspected and partitioned by a Registry Officer, an allocation offer will appear in your portal.
        </p>
      </div>

      {/* Applications Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading applications…</p>
        ) : applications.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '8px' }}>No Land Applications Lodged Yet</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Begin your state land acquisition process by submitting a formal request to your preferred province.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
              Submit First Application
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-card)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>APPLICATION NO.</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>WAITING LIST NO.</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>INTENDED USE</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>HECTARES / CAPITAL</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ALLOCATED PARCEL</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>LODGED ON</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => {
                  const badge = getStatusBadge(app.status);
                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                        {app.applicationNumber}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {app.waitingListNumber ? (
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: 'var(--accent-400)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}>
                            {app.waitingListNumber}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem' }}>
                        {app.proposedLandUse.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem' }}>
                        <div>{app.hectaresRequested ? `${app.hectaresRequested} ha` : 'Unspecified'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {app.capitalInvestmentUsd ? `$${app.capitalInvestmentUsd.toLocaleString()} USD` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem' }}>
                        {app.parcel ? (
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{app.parcel.referenceNumber}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.parcel.areaHectares} ha allocated</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>Awaiting Allocation</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Lodge New Application */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Lodge State Land Lease Application</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 14px', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', borderRadius: '6px', fontSize: '0.8125rem' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateApplication} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Target Free Land Parcel (Optional)
                  </label>
                  <Link href="/parcels?status=AVAILABLE&view=map" style={{ fontSize: '0.75rem', color: 'var(--primary-400)', textDecoration: 'none' }}>
                    🗺️ Pick Visually from GIS Map ↗
                  </Link>
                </div>
                <select
                  className="glass-input"
                  value={formData.parcelId}
                  onChange={e => {
                    const pId = e.target.value;
                    const selected = availableParcels.find(p => p.id === pId);
                    if (selected) {
                      const matchedProv = provinces.find(prov => prov.name.toLowerCase() === selected.province.toLowerCase() || prov.id === selected.province);
                      setFormData({
                        ...formData,
                        parcelId: pId,
                        provinceId: matchedProv?.id || formData.provinceId,
                        hectaresRequested: selected.areaHectares,
                      });
                    } else {
                      setFormData({ ...formData, parcelId: '' });
                    }
                  }}
                >
                  <option value="">General Application (Unassigned Parcel)</option>
                  {availableParcels.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.referenceNumber} — {p.name} ({p.areaHectares} ha, {p.province})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Target Province *
                </label>
                <select
                  className="glass-input"
                  required
                  value={formData.provinceId}
                  onChange={e => setFormData({ ...formData, provinceId: e.target.value })}
                >
                  <option value="">Select Administrative Province</option>
                  {provinces.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Proposed Agricultural / Land Use Category *
                </label>
                <select
                  className="glass-input"
                  value={formData.proposedLandUse}
                  onChange={e => setFormData({ ...formData, proposedLandUse: e.target.value })}
                >
                  <option value="CROPPING">Commercial Cropping (Maize, Wheat, Soya, Tobacco)</option>
                  <option value="LIVESTOCK">Livestock / Cattle Ranching / Dairy</option>
                  <option value="HORTICULTURE">Horticulture, Citrus & Export Floriculture</option>
                  <option value="AGRO_FORESTRY">Agro-Forestry & Timber Production</option>
                  <option value="MIXED_FARMING">Integrated Mixed Farming (A2 Scheme)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Requested Area (Hectares) *
                  </label>
                  <input
                    type="number"
                    className="glass-input"
                    required
                    min={5}
                    max={5000}
                    value={formData.hectaresRequested}
                    onChange={e => setFormData({ ...formData, hectaresRequested: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Committed Capital ($USD) *
                  </label>
                  <input
                    type="number"
                    className="glass-input"
                    required
                    min={1000}
                    value={formData.capitalInvestmentUsd}
                    onChange={e => setFormData({ ...formData, capitalInvestmentUsd: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Project Brief & Production Plan
                </label>
                <textarea
                  className="glass-input"
                  rows={3}
                  placeholder="Outline proposed irrigation, machinery, crop varieties, and job creation projections..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Lodging Application…' : 'Submit Application & Join Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
