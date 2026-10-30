'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';

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

      const res = await fetch(`/api/backend/api/v1/applications/${app.id}/approval`, {
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

      const res = await fetch(`/api/backend/api/v1/applications/${rejectingApp.id}/rejection`, {
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
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Approver Authority: {currentUser?.name}
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Statutory Land Allocation Approvals
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '640px' }}>
            Final review authority for state land allocations. Validates cadastre boundaries, applicant KYC credentials, and enforces strict Segregation of Duties.
          </p>
        </div>
      </div>

      {/* Segregation of Duties Banner */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        background: 'rgba(34, 197, 94, 0.08)',
        borderColor: 'rgba(34, 197, 94, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}>
        <span style={{ fontSize: '1.5rem' }}>🛡️</span>
        <div>
          <h4 style={{ color: 'var(--primary-400)', fontSize: '0.9375rem', marginBottom: '2px' }}>
            Statutory Anti-Corruption & Segregation of Duties Policy
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
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
                            disabled={isConflict || processingId === app.id}
                            title={isConflict ? 'Segregation of duties violation: you allocated this parcel' : 'Authorize and generate statutory lease offer'}
                            onClick={() => handleApprove(app)}
                          >
                            {processingId === app.id ? 'Approving…' : 'Approve & Issue Offer'}
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
