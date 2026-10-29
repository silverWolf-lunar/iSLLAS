'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeaseItem {
  id: string;
  leaseNumber: string;
  status: string;
  startDate: string;
  endDate?: string;
  termYears: number;
  annualRentUsd: number;
  currency: string;
  paymentFrequency: string;
  parcel?: {
    id: string;
    referenceNumber: string;
    areaHectares: number;
  };
}

export default function ClientLeasesPage() {
  const [leases, setLeases] = useState<LeaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchLeases();
  }, []);

  async function fetchLeases() {
    try {
      setLoading(true);
      const res = await fetch('/api/backend/api/v1/leases');
      if (res.ok) {
        const data = await res.json();
        setLeases(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Failed to load leases', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptOffer(leaseId: string) {
    if (!confirm('Are you sure you wish to accept this Lease Offer and execute the statutory 99-year agreement under the Laws of Zimbabwe?')) {
      return;
    }

    try {
      setAcceptingId(leaseId);
      setErrorMsg(null);

      const res = await fetch(`/api/backend/api/v1/leases/${leaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to accept lease offer');
      }

      setSuccessMsg('Lease Agreement executed successfully! Your statutory title is now ACTIVE.');
      await fetchLeases();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error accepting lease offer');
    } finally {
      setAcceptingId(null);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: 'var(--primary-400)', border: 'rgba(34, 197, 94, 0.4)' };
      case 'PENDING_ACCEPTANCE':
        return { bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-400)', border: 'rgba(245, 158, 11, 0.4)' };
      case 'TERMINATED':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', color: 'var(--text-muted)', border: 'rgba(148, 163, 184, 0.4)' };
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
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Statutory Leases</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Offers & Statutory Land Leases
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Review official Ministry offers, execute 99-year lease covenants, and view legal agreement documents.
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

      {/* Leases Grid */}
      {loading ? (
        <p style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading leases and offers…</p>
      ) : leases.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '8px' }}>No Leases or Offers Found</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 20px' }}>
            When a land parcel has been approved and allocated to your application by the Land Board, an official Lease Offer will appear here for your signature.
          </p>
          <Link href="/client/applications" className="btn btn-outline">
            Check Application Status
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {leases.map(lease => {
            const badge = getStatusBadge(lease.status);
            const isOffer = lease.status === 'PENDING_ACCEPTANCE';

            return (
              <div
                key={lease.id}
                className="glass-panel"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '20px',
                  borderColor: isOffer ? 'rgba(245, 158, 11, 0.4)' : undefined,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        LEASE RECORD
                      </span>
                      <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                        {lease.leaseNumber}
                      </h3>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                    }}>
                      {lease.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Parcel Reference</div>
                      <div style={{ fontWeight: 600, color: 'var(--primary-400)', fontSize: '0.875rem' }}>
                        {lease.parcel?.referenceNumber || 'Unassigned'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Demised Area</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                        {lease.parcel?.areaHectares ? `${lease.parcel.areaHectares} ha` : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Annual Rental</div>
                      <div style={{ fontWeight: 600, color: 'var(--accent-300)', fontSize: '0.875rem' }}>
                        ${lease.annualRentUsd?.toLocaleString()} {lease.currency || 'USD'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tenure Term</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                        {lease.termYears || 99} Years
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Start Date: <strong>{lease.startDate ? new Date(lease.startDate).toLocaleDateString() : 'Upon Signature'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {isOffer && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={acceptingId === lease.id}
                      onClick={() => handleAcceptOffer(lease.id)}
                    >
                      {acceptingId === lease.id ? 'Executing Agreement…' : 'Accept & Execute Lease'}
                    </button>
                  )}
                  <Link
                    href={`/estates/leases/${lease.id}/print`}
                    target="_blank"
                    className="btn btn-outline"
                    style={{ flex: isOffer ? undefined : 1 }}
                  >
                    📄 View Legal Document
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
