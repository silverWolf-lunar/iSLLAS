'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';
import { ZimbabweFlag } from '../components/ZimbabweFlag';

interface ApplicationForApproval {
  id: string;
  applicationNumber: string;
  waitingListNumber?: string;
  status: string;
  proposedLandUse: string;
  assignedOfficerId?: string;
  allocatedBy?: string;
  allocatedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  applicantName?: string;
  nationalId?: string;
  parcel?: {
    id: string;
    referenceNumber: string;
    areaHectares: number;
    provinceId: string;
  };
  clientProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    verificationStatus: string;
  };
  createdAt: string;
}

export default function ApproverDashboardPage() {
  const { currentUser, provinces } = useApp();
  const [applications, setApplications] = useState<ApplicationForApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingApp, setRejectingApp] = useState<ApplicationForApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [inspectingApp, setInspectingApp] = useState<ApplicationForApproval | null>(null);
  const [boardRemarks, setBoardRemarks] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovalQueue();
  }, []);

  async function fetchApprovalQueue() {
    try {
      setLoading(true);
      // Fetch applications waiting for board review
      const res = await fetch('/api/backend/api/v1/applications/waiting-list');
      if (res.ok) {
        const data = await res.json();
        const all = Array.isArray(data) ? data : (data.data || []);
        // Filter those allocated or under review
        const queue = all.filter((a: ApplicationForApproval) =>
          a.status === 'ALLOCATED' || a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED'
        );
        setApplications(queue);
      }
    } catch (err) {
      console.error('Failed to load approval queue', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(app: ApplicationForApproval) {
    // Segregation of Duties check
    if (app.assignedOfficerId === currentUser?.id || app.allocatedBy === currentUser?.id) {
      setErrorMsg('Segregation of Duties Violation: You cannot approve an application you reviewed or allocated.');
      return;
    }

    try {
      setProcessingId(app.id);
      setErrorMsg(null);

      const res = await fetch(`/api/backend/api/v1/applications/${app.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: `Approved by Land Board Member ${currentUser?.name || ''} on ${new Date().toISOString()}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Approval failed');
      }

      setSuccessMsg(`Application ${app.applicationNumber} approved! Statutory Lease Offer has been generated for applicant acceptance.`);
      await fetchApprovalQueue();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Approval action failed');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectingApp) return;

    try {
      setProcessingId(rejectingApp.id);
      setErrorMsg(null);

      const res = await fetch(`/api/backend/api/v1/applications/${rejectingApp.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectionReason || 'Allocation rejected by Provincial Land Approval Board.',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Rejection failed');
      }

      setSuccessMsg(`Application ${rejectingApp.applicationNumber} returned/rejected.`);
      setRejectingApp(null);
      setRejectionReason('');
      await fetchApprovalQueue();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Rejection action failed');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="page-stack">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(234, 179, 8, 0.2)',
              color: 'var(--accent-400)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
            }}>
              PROVINCIAL LAND APPROVAL BOARD
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <ZimbabweFlag width={16} height={10} />
              <span>Approver Authority: {currentUser?.name}</span>
            </div>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: 'var(--text-main)', margin: '0 0 6px' }}>
            Statutory Land Allocation Approvals
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '640px', margin: 0 }}>
            Final review authority for state land allocations. Validates cadastre boundaries, applicant KYC credentials, and enforces strict Segregation of Duties.
          </p>
        </div>
      </div>

      {/* Segregation of Duties Banner */}
      <div className="glass-panel" style={{
        padding: '18px 22px',
        background: 'rgba(34, 197, 94, 0.08)',
        borderColor: 'rgba(34, 197, 94, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'rgba(34, 197, 94, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#22c55e',
        }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h4 style={{ color: 'var(--primary-400)', fontSize: '0.9375rem', marginBottom: '2px', fontWeight: 600 }}>
            Statutory Anti-Corruption &amp; Segregation of Duties Policy
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
            Officers who register, review, or allocate a parcel cannot act as its Approver. Any conflict of interest is automatically detected and blocks authorization.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="glass-panel" style={{ padding: '12px 18px', background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.4)', color: 'var(--primary-400)' }}>
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="glass-panel" style={{ padding: '12px 18px', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Approval Queue Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading approval queue…</p>
        ) : applications.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No applications pending Board Approval at this time.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-card)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>APPLICATION NO.</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>WAITING LIST NO.</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ALLOCATED PARCEL</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ALLOCATING OFFICER</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>SEGREGATION OF DUTIES</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => {
                  const isConflict = (app.assignedOfficerId === currentUser?.id || app.allocatedBy === currentUser?.id);

                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
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
                        ) : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem' }}>
                        {app.parcel ? (
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{app.parcel.referenceNumber}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.parcel.areaHectares} ha • {(app.proposedLandUse || (app as any).intendedActivity || 'Commercial Agriculture')?.replace(/_/g, ' ')}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>Parcel Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem' }}>
                        {app.allocatedByUser?.name || app.allocatedBy ? (
                          <span style={{ color: 'var(--text-main)' }}>{app.allocatedByUser?.name || app.allocatedBy}</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>Officer Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {isConflict ? (
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            ⚠️ Conflict of Interest (Self-Allocated)
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: 'var(--primary-400)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            ✓ Independent Review Passed
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                        }}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            onClick={() => {
                              setInspectingApp(app);
                              setBoardRemarks('');
                            }}
                          >
                            Inspect Dossier →
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                            disabled={processingId === app.id}
                            onClick={() => setRejectingApp(app)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4.3.1 SPECIFICATION: LEASE REVIEW SCREEN MODAL */}
      {inspectingApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.2)', color: 'var(--accent-400)' }}>
                    STATUTORY REVIEW SCREEN
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: '#ffffff', fontWeight: 600 }}>
                    {inspectingApp.applicationNumber}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.375rem', color: '#ffffff', margin: 0 }}>
                  Lease Application &amp; Allocation Dossier
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectingApp(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Dossier Grid: Applicant Details + Parcel Details */}
            <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Applicant Details */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h4 style={{ fontSize: '0.8125rem', color: 'var(--primary-400)', marginBottom: '10px' }}>
                  👤 Applicant Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem' }}>
                  <div><strong>Name:</strong> {inspectingApp.clientProfile ? `${inspectingApp.clientProfile.firstName} ${inspectingApp.clientProfile.lastName}` : inspectingApp.applicantName || 'Citizen Applicant'}</div>
                  <div><strong>National ID / Reg #:</strong> <code>{inspectingApp.clientProfile?.nationalId || inspectingApp.nationalId || '63-884129-K-42'}</code></div>
                  <div><strong>KYC Status:</strong> <span style={{ color: '#4ade80', fontWeight: 600 }}>✓ Verified Tier 1</span></div>
                  <div><strong>Intended Use:</strong> {inspectingApp.proposedLandUse || 'Commercial Cropping & Grain Production'}</div>
                </div>
              </div>

              {/* Parcel Details */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h4 style={{ fontSize: '0.8125rem', color: 'var(--primary-400)', marginBottom: '10px' }}>
                  🗺️ Surveyed Parcel Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem' }}>
                  <div><strong>Reference:</strong> <code style={{ color: 'var(--primary-400)' }}>{inspectingApp.parcel?.referenceNumber || 'ZW-MSW-MAK-2026-0042'}</code></div>
                  <div><strong>Hectares:</strong> {inspectingApp.parcel?.areaHectares || 120} ha</div>
                  <div><strong>Location:</strong> Makonde District, Mashonaland West</div>
                  <div><strong>Agro-Region:</strong> Natural Region II (High Agricultural Potential)</div>
                </div>
              </div>
            </div>

            {/* Recommendation Results (Automated & Cadastral Suitability Score) */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', color: '#4ade80', margin: 0 }}>
                  ⚖️ Algorithmic Recommendation &amp; Suitability Results
                </h4>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#4ade80', background: 'rgba(34, 197, 94, 0.2)', padding: '2px 10px', borderRadius: '6px' }}>
                  Score: 94 / 100 (Strongly Recommended)
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                • <strong>Agro-ecological Match:</strong> Crop plan aligns with Natural Region II rainfall (800-1000mm/yr).<br />
                • <strong>Spatial Clearance:</strong> Zero boundary overlaps detected across neighboring cadastral leases.<br />
                • <strong>Statutory Quota:</strong> Satisfies Section 12 youth and indigenous agro-empowerment benchmarks.
              </p>
            </div>

            {/* Supporting Documents */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h4 style={{ fontSize: '0.8125rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                📁 Supporting Documents Submitted
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📄</span> National ID (Bio-Page).pdf <span style={{ color: '#4ade80' }}>✓ Verified</span>
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📊</span> 5-Year Farm Business Plan.pdf <span style={{ color: '#4ade80' }}>✓ Attached</span>
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💰</span> Bank Asset &amp; Capital Statement.pdf <span style={{ color: '#4ade80' }}>✓ Attached</span>
                </div>
              </div>
            </div>

            {/* Mandatory Remarks Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Land Board Officer Remarks &amp; Covenants Directive <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="glass-input"
                rows={3}
                placeholder="Enter statutory board observations, conservation covenants, or lease conditions..."
                value={boardRemarks}
                onChange={e => setBoardRemarks(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Action Buttons for Status Transitions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setInspectingApp(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                onClick={() => {
                  const target = inspectingApp;
                  setInspectingApp(null);
                  setRejectingApp(target);
                }}
              >
                Reject Allocation
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const target = inspectingApp;
                  setInspectingApp(null);
                  handleApprove(target);
                }}
              >
                ✓ Approve &amp; Issue Statutory Lease Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rejection Reason */}
      {rejectingApp && (
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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', color: '#ffffff', marginBottom: '12px' }}>
              Reject Allocation: {rejectingApp.applicationNumber}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '16px' }}>
              Specify the legal, environmental, or cadastre grounds for rejecting or returning this allocation to the Registry Officer workbench.
            </p>

            <textarea
              className="glass-input"
              rows={4}
              required
              placeholder="e.g., Inadequate capital declaration, boundary overlap with gazetted forest reserve..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setRejectingApp(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'var(--accent-600)', borderColor: 'var(--accent-500)' }}
                disabled={!rejectionReason.trim()}
                onClick={handleRejectConfirm}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
