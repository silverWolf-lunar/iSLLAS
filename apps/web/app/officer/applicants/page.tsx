'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface ClientDoc {
  id: string;
  type: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  uploadedAt: string;
  status: string;
}

interface ClientProfile {
  id: string;
  userId: string;
  clientType: 'INDIVIDUAL' | 'CORPORATE';
  firstName: string;
  lastName: string;
  nationalId: string;
  companyName?: string;
  companyNumber?: string;
  email: string;
  phone: string;
  physicalAddress: string;
  city: string;
  country: string;
  taxNumber?: string;
  verificationStatus: string;
  documents?: ClientDoc[];
  createdAt: string;
}

export default function OfficerApplicantsPage() {
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ClientProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      setLoading(true);
      const res = await fetch('/api/backend/api/v1/client-profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Failed to load profiles', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(status: 'VERIFIED' | 'REJECTED') {
    if (!selectedProfile) return;

    try {
      setActionLoading(true);
      setErrorMsg(null);

      const res = await fetch(`/api/backend/api/v1/client-profiles/${selectedProfile.id}/verification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: verificationNotes || `Processed by Registry Officer on ${new Date().toISOString()}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update verification status');
      }

      const updated = await res.json();
      setProfiles(prev => prev.map(p => (p.id === updated.id ? { ...p, ...updated } : p)));
      setSelectedProfile(null);
      setVerificationNotes('');
      setSuccessMsg(`Applicant KYC status successfully changed to ${status}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = profiles.filter(p => {
    if (filterStatus === 'ALL') return true;
    return p.verificationStatus === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: 'var(--primary-400)', border: 'rgba(34, 197, 94, 0.4)' };
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
            <Link href="/officer" style={{ color: 'var(--primary-400)', fontSize: '0.8125rem' }}>
              ← Registry Officer Portal
            </Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>KYC Review Queue</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Applicant Review & KYC Verification Queue
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Verify statutory identity documents, corporate incorporation filings, and tax clearance certificates.
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Filter Status:</label>
          <select
            className="glass-input"
            style={{ width: 'auto' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Applicants ({profiles.length})</option>
            <option value="UNVERIFIED">Unverified / Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="glass-panel" style={{ padding: '12px 18px', background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.4)', color: 'var(--primary-400)' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Main Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading applicant profiles…</p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No applicants match the selected filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-card)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>APPLICANT</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>NATIONAL ID / REG NO.</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>CONTACT</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>LOCATION</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DOCUMENTS</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(profile => {
                  const badge = getStatusBadge(profile.verificationStatus);
                  const docsCount = profile.documents?.length || 0;
                  return (
                    <tr key={profile.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>
                          {profile.firstName} {profile.lastName}
                        </div>
                        {profile.companyName && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-400)' }}>
                            🏢 {profile.companyName}
                          </div>
                        )}
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
                          {profile.clientType}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                        {profile.nationalId || profile.companyNumber || '—'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem' }}>
                        <div>{profile.phone}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{profile.email}</div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {profile.city}, {profile.country}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: docsCount > 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                          color: docsCount > 0 ? '#60a5fa' : 'var(--text-dim)',
                        }}>
                          📎 {docsCount} Lodged
                        </span>
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
                          {profile.verificationStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedProfile(profile);
                            setVerificationNotes('');
                          }}
                        >
                          Inspect KYC
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal / Side Drawer for KYC Inspection */}
      {selectedProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 600 }}>KYC AUDIT INSPECTION</span>
                <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
                  {selectedProfile.firstName} {selectedProfile.lastName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
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

            {/* Profile Overview Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>National ID / Reg No.</div>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedProfile.nationalId || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ZIMRA Tax BP Number</div>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedProfile.taxNumber || 'None declared'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone</div>
                <div style={{ fontWeight: 600 }}>{selectedProfile.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</div>
                <div style={{ fontWeight: 600 }}>{selectedProfile.email}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Physical Address</div>
                <div>{selectedProfile.physicalAddress}, {selectedProfile.city}, {selectedProfile.country}</div>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📎</span> Attached Statutory Verification Documents
            </h3>

            {(!selectedProfile.documents || selectedProfile.documents.length === 0) ? (
              <p style={{ color: 'var(--accent-400)', fontSize: '0.875rem', marginBottom: '20px' }}>
                ⚠️ No documents have been lodged by this applicant yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {selectedProfile.documents.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.5)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{doc.fileName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {doc.type.replace('_', ' ')} • {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <a
                      href={`/api/backend/api/v1/uploads/${encodeURIComponent(doc.storageKey)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      View Document
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Officer Notes & Action */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Officer Audit Verification Notes
              </label>
              <textarea
                className="glass-input"
                rows={2}
                placeholder="Enter statutory inspection comments or reasons for rejection..."
                value={verificationNotes}
                onChange={e => setVerificationNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('REJECTED')}
              >
                Reject Applicant
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('VERIFIED')}
              >
                {actionLoading ? 'Processing…' : '✓ Verify KYC Eligibility'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
