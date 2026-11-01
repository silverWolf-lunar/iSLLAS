'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ParcelRecord } from '../lib/parcel-data';

interface ApplyForParcelModalProps {
  parcel: ParcelRecord;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (app: any) => void;
}

export function ApplyForParcelModal({
  parcel,
  isOpen,
  onClose,
  onSuccess,
}: ApplyForParcelModalProps) {
  const [intendedActivity, setIntendedActivity] = useState(
    parcel.leaseClassification?.permittedEnterprises?.[0] || 'Commercial Cropping & Grain Production'
  );
  const [businessPlanSummary, setBusinessPlanSummary] = useState(
    `Proposed ${parcel.leaseClassification?.shortName || 'agricultural'} enterprise with modern conservation farming, irrigation infrastructure development, and local employment generation in accordance with ${parcel.leaseClassification?.statutoryAct || 'statutory leasehold regulations'}.`
  );
  const [requestedTermYears, setRequestedTermYears] = useState(parcel.leaseClassification?.termYears || 99);
  const [proposedInvestmentUsd, setProposedInvestmentUsd] = useState(15000);
  const [expectedJobsCreated, setExpectedJobsCreated] = useState(8);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      // 1. Create Application Draft with parcelId
      const draftRes = await fetch('/api/backend/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId: parcel.id,
          intendedActivity,
          businessPlanSummary,
          requestedTermYears: Number(requestedTermYears),
          proposedInvestmentUsd: Number(proposedInvestmentUsd),
          expectedJobsCreated: Number(expectedJobsCreated),
        }),
      });

      if (!draftRes.ok) {
        const err = await draftRes.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to lodge application draft');
      }

      const draftApp = await draftRes.json();

      // 2. Attempt immediate submission to reserve parcel & get waiting list number
      let finalApp = draftApp;
      try {
        const submitRes = await fetch(`/api/backend/api/v1/applications/${draftApp.id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (submitRes.ok) {
          finalApp = await submitRes.json();
        }
      } catch (submitErr) {
        // If unverified, it remains a DRAFT
        console.warn('Auto-submit did not complete (profile might be unverified)', submitErr);
      }

      setSubmittedApp(finalApp);
      onSuccess?.(finalApp);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting application');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px',
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        {submittedApp ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', border: '2px solid var(--primary-400)', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>
              ✓
            </div>
            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '8px' }}>
              Application Successfully Lodged!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '480px', margin: '0 auto 20px' }}>
              Your application for parcel <strong style={{ color: 'var(--primary-400)', fontFamily: 'var(--font-mono)' }}>{parcel.referenceNumber}</strong> ({parcel.areaHectares} ha) has been recorded in the National Cadastre.
            </p>

            {submittedApp.waitingListNumber ? (
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'inline-block',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-400)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Statutory Waiting List Number
                </div>
                <div style={{ fontSize: '1.375rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff', marginTop: '2px' }}>
                  {submittedApp.waitingListNumber}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Status: <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>SUBMITTED & PARCEL RESERVED</span>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '14px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--accent-400)',
                fontSize: '0.8125rem',
                marginBottom: '24px',
                textAlign: 'left',
              }}>
                ⚠️ <strong>Application Draft Created:</strong> Your application draft has been saved. Under Zimbabwe statutory regulations, please ensure your KYC documents (National ID & Proof of Residence) are uploaded to complete final submission.
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
              >
                Close
              </button>
              <Link href="/client/applications" className="btn btn-primary">
                View in Applications Tracker →
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cadastre Land Allocation Request
                </span>
                <h2 style={{ fontSize: '1.375rem', color: '#ffffff', marginTop: '2px' }}>
                  Apply for Free Land Parcel
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Selected Parcel Badge Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: `1px solid ${parcel.leaseClassification?.borderColor || 'rgba(34, 197, 94, 0.3)'}`,
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: parcel.leaseClassification?.color || 'var(--primary-400)', textTransform: 'uppercase' }}>
                    📜 Lease Classification:
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: parcel.leaseClassification?.color || '#4ade80',
                    background: parcel.leaseClassification?.bgColor || 'rgba(34, 197, 94, 0.15)',
                    border: `1px solid ${parcel.leaseClassification?.borderColor || 'rgba(34, 197, 94, 0.35)'}`
                  }}>
                    {parcel.leaseClassification?.shortName || 'A2 Commercial'}
                  </span>
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Statutory Term: <strong style={{ color: '#ffffff' }}>{parcel.leaseClassification?.termLabel || '99-Year Leasehold'}</strong>
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Parcel Reference</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontSize: '0.875rem' }}>
                    {parcel.referenceNumber}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Surface Area</div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.875rem' }}>
                    {parcel.areaHectares} ha
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Province / District</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    {parcel.district}, {parcel.province}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Natural Region</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--accent-400)', fontWeight: 600 }}>
                    Region {parcel.naturalRegion || 'II'}
                  </div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 14px', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', borderRadius: '6px', fontSize: '0.8125rem' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Proposed Agricultural Farming Activity *
                </label>
                <select
                  className="glass-input"
                  value={intendedActivity}
                  onChange={e => setIntendedActivity(e.target.value)}
                >
                  <option value="Commercial Cropping & Grain Production">Commercial Cropping (Maize, Wheat, Soya, Sunflower)</option>
                  <option value="Tobacco Production & Curing Scheme">Commercial Tobacco Farming (A2 Scheme)</option>
                  <option value="Cattle & Livestock Ranching">Cattle & Livestock Ranching / Dairy</option>
                  <option value="Export Horticulture & Irrigation">Export Horticulture & Citrus Orchards</option>
                  <option value="Integrated Mixed Agricultural Scheme">Integrated Mixed Crop & Small Stock Farming</option>
                  <option value="Agro-Forestry & Timber Estate">Agro-Forestry & Indigenous Timber Management</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Business Plan & Production Summary * (min 50 characters)
                </label>
                <textarea
                  className="glass-input"
                  rows={3}
                  required
                  minLength={50}
                  value={businessPlanSummary}
                  onChange={e => setBusinessPlanSummary(e.target.value)}
                  placeholder="Describe your cropping plan, tillage approach, irrigation equipment, and expected yields..."
                />
                <span style={{ fontSize: '0.6875rem', color: businessPlanSummary.length < 50 ? '#f87171' : 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  {businessPlanSummary.length} / 50 characters minimum
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Requested Term (Years)
                  </label>
                  <select
                    className="glass-input"
                    value={requestedTermYears}
                    onChange={e => setRequestedTermYears(Number(e.target.value))}
                  >
                    <option value={99}>99-Year Leasehold (Standard)</option>
                    <option value={25}>25-Year Commercial Lease</option>
                    <option value={10}>10-Year Experimental Lease</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Committed Capital ($USD)
                  </label>
                  <input
                    type="number"
                    className="glass-input"
                    min={1000}
                    step={1000}
                    value={proposedInvestmentUsd}
                    onChange={e => setProposedInvestmentUsd(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Projected Jobs Created
                  </label>
                  <input
                    type="number"
                    className="glass-input"
                    min={1}
                    value={expectedJobsCreated}
                    onChange={e => setExpectedJobsCreated(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || businessPlanSummary.length < 50}
                  style={{ background: 'var(--primary-600)', borderColor: 'var(--primary-400)' }}
                >
                  {submitting ? 'Lodging Application…' : '✓ Submit Application for Parcel'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
