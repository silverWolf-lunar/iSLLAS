'use client';

import React, { useState } from 'react';
import { useApp } from '../../components/AppContext';
import { SpatialMap } from '../../components/SpatialMap';
import { ParcelRecord } from '../../lib/parcel-data';
import { ParcelStatus } from '@sllas/contracts';

export default function VerificationWorkbenchPage() {
  const { parcels, currentUser, verifyParcel } = useApp();

  const pendingParcels = parcels.filter(p => p.status === ParcelStatus.PENDING_VERIFICATION);
  const [selectedParcel, setSelectedParcel] = useState<ParcelRecord | null>(pendingParcels[0] || null);

  // Verification Checklist State
  const [checkGeometry, setCheckGeometry] = useState(true);
  const [checkZoning, setCheckZoning] = useState(true);
  const [checkSurvey, setCheckSurvey] = useState(true);
  const [checkDisputes, setCheckDisputes] = useState(true);
  const [verifierNotes, setVerifierNotes] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Check Segregation of Duties
  const isOwnParcel = Boolean(currentUser && selectedParcel?.registeredByUserId === currentUser.id);
  const canVerify = !isOwnParcel || currentUser?.role === 'SYSTEM_ADMIN';

  const handleDecision = (decision: 'VERIFY' | 'RETURN_FOR_CORRECTION') => {
    if (!selectedParcel) return;
    if (!verifierNotes.trim()) {
      alert('Verifier notes are mandatory to record in the audit trail.');
      return;
    }

    const res = verifyParcel(selectedParcel.id, decision, verifierNotes);
    setActionFeedback(res);

    if (res.success) {
      setVerifierNotes('');
      // Advance to next pending parcel if available
      const remaining = pendingParcels.filter(p => p.id !== selectedParcel.id);
      setSelectedParcel(remaining[0] || null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title & Governance Alert */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-400)' }}>
            GOVERNANCE ENFORCEMENT
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Segregation of Duties Protocol</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', color: '#ffffff' }}>Parcel Verification Workbench</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Second-officer independent review queue. Before any parcel is certified as AVAILABLE for public lease, its spatial boundaries and tenure must be verified by a distinct officer.
        </p>
      </div>

      {/* Segregation of Duties Governance Banner */}
      <div style={{
        padding: '14px 18px',
        borderRadius: '8px',
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-400)',
            fontWeight: 800
          }}>
            ⚖️
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ffffff' }}>
              Statutory Two-Officer Verification Rule
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Active Officer: <strong style={{ color: 'var(--primary-400)' }}>{currentUser?.name ?? ''}</strong> ({currentUser?.role ?? ''}) • {currentUser?.office ?? ''}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Tip: You can switch active identity in the top-right header to test segregation-of-duties enforcement.
        </div>
      </div>

      {actionFeedback && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          background: actionFeedback.success ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${actionFeedback.success ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: actionFeedback.success ? '#86efac' : '#fca5a5',
          fontSize: '0.875rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {pendingParcels.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '2.5rem' }}>✅</div>
          <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Verification Queue Clear</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px' }}>
            All submitted land parcels have been reviewed and verified. New parcels submitted by registry officers will appear here automatically.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>
          {/* Left Column: Pending List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Pending Parcels ({pendingParcels.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingParcels.map(parcel => {
                const isSelected = selectedParcel?.id === parcel.id;
                const isOwn = parcel.registeredByUserId === currentUser?.id;

                return (
                  <div
                    key={parcel.id}
                    onClick={() => { setSelectedParcel(parcel); setActionFeedback(null); }}
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--primary-400)' : undefined,
                      background: isSelected ? 'rgba(30, 41, 59, 0.95)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 600 }}>
                        {parcel.referenceNumber}
                      </span>
                      {isOwn && (
                        <span style={{ fontSize: '0.625rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                          Registered by you
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#ffffff' }}>
                      {parcel.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {parcel.district}, {parcel.province} • {parcel.areaHectares} ha
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                      Submitted by: {parcel.registeredByUserName} on {new Date(parcel.registeredAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Verification Dossier & Decision Controls */}
          {selectedParcel && (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontWeight: 600 }}>
                    {selectedParcel.referenceNumber}
                  </span>
                  <span className="badge badge-pending">
                    PENDING VERIFICATION
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', color: '#ffffff', marginTop: '4px' }}>
                  {selectedParcel.name}
                </h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {selectedParcel.district}, {selectedParcel.province} • {selectedParcel.ward}
                </div>
              </div>

              {/* Segregation of Duties Warning if Same User */}
              {isOwnParcel && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🚫</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fca5a5' }}>
                      Segregation of Duties Enforcement Active
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fecaca', marginTop: '2px' }}>
                      You registered this parcel ({currentUser?.name}). Under administrative rules, a different authorized officer must verify the submission.
                    </div>
                  </div>
                </div>
              )}

              {/* Attributes Card */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Cadastral Area</div>
                  <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#ffffff' }}>{selectedParcel.areaHectares} ha</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Land Tenure Category</div>
                  <div style={{ fontWeight: 600 }}>{selectedParcel.landCategory}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Natural Agro-Ecological Region</div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-400)' }}>
                    Region {selectedParcel.naturalRegion}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Soil Classification</div>
                  <div style={{ fontWeight: 600 }}>{selectedParcel.soilType}</div>
                </div>
              </div>

              {/* Boundary Preview */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Cadastral Polygon Verification Map
                </div>
                <SpatialMap
                  parcels={[selectedParcel]}
                  selectedParcelId={selectedParcel.id}
                  height={220}
                />
              </div>

              {/* Verification Checklist */}
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                  Statutory Verification Checklist
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checkGeometry}
                      onChange={(e) => setCheckGeometry(e.target.checked)}
                      disabled={!canVerify}
                    />
                    <span>Boundary geometry validated with zero overlaps against neighbouring surveyed parcels</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checkZoning}
                      onChange={(e) => setCheckZoning(e.target.checked)}
                      disabled={!canVerify}
                    />
                    <span>Permitted lease activities match provincial agro-ecological land-use policy</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checkSurvey}
                      onChange={(e) => setCheckSurvey(e.target.checked)}
                      disabled={!canVerify}
                    />
                    <span>Survey coordinates and boundary diagram certified</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checkDisputes}
                      onChange={(e) => setCheckDisputes(e.target.checked)}
                      disabled={!canVerify}
                    />
                    <span>No unrecorded traditional authority or community boundaries under dispute</span>
                  </label>
                </div>
              </div>

              {/* Mandatory Verifier Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Verifier Inspection Notes (Mandatory for Audit Trail) *
                </label>
                <textarea
                  className="glass-input"
                  rows={3}
                  placeholder="Record verification findings, survey sheet reference, or reasons for return..."
                  value={verifierNotes}
                  onChange={(e) => setVerifierNotes(e.target.value)}
                  disabled={!canVerify}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => handleDecision('RETURN_FOR_CORRECTION')}
                  className="btn btn-outline"
                  style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--accent-400)' }}
                  disabled={!canVerify || !verifierNotes.trim()}
                >
                  Return for Correction
                </button>
                <button
                  onClick={() => handleDecision('VERIFY')}
                  className="btn btn-primary"
                  disabled={!canVerify || !verifierNotes.trim()}
                >
                  ✓ Verify & Publish AVAILABLE
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
