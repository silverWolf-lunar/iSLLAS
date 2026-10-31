'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeaseRecord {
  id: string;
  leaseNumber: string;
  status: string;
  termYears: number;
  annualRentUsd: number;
  currency: string;
  startDate: string;
  endDate?: string;
  paymentFrequency: string;
  clientName?: string;
  parcel?: {
    id: string;
    referenceNumber: string;
    areaHectares: number;
  };
  application?: {
    id: string;
    applicationNumber: string;
    waitingListNumber?: string;
  };
}

export default function EstatesLeasesPage() {
  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchLeases();
  }, []);

  async function fetchLeases() {
    try {
      setLoading(true);
      const res = await fetch('/api/backend/api/v1/leases');
      if (res.ok) {
        const data = await res.json();
        setLeases(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error('Failed to load leases', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = leases.filter(l => {
    if (!statusFilter) return true;
    return l.status === statusFilter;
  });

  const getStatusBadge = (status: string, endDate?: string) => {
    const isPastDue = endDate && new Date(endDate) < new Date();
    if (status === 'EXPIRED' || isPastDue) {
      return { bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-400)', border: 'rgba(245, 158, 11, 0.4)', text: 'EXPIRED' };
    }
    switch (status) {
      case 'ACTIVE':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: 'var(--primary-400)', border: 'rgba(34, 197, 94, 0.4)', text: 'ACTIVE' };
      case 'PENDING_ACCEPTANCE':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)', text: 'PENDING ACCEPTANCE' };
      case 'TERMINATED':
      case 'CANCELLED':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'rgba(239, 68, 68, 0.4)', text: 'CANCELLED' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', color: 'var(--text-muted)', border: 'rgba(148, 163, 184, 0.4)', text: status.replace('_', ' ') };
    }
  };

  const computeDaysLeft = (endDate?: string) => {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="page-stack">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/estates" style={{ color: 'var(--primary-400)', fontSize: '0.8125rem' }}>
              ← Estates Portal
            </Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Lease Agreements</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Statutory 99-Year Lease Roll
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage executed leases, audit expiry windows (90/60/30 days), and print official legal agreements under the Agricultural Land Settlement Act.
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Status:</label>
          <select
            className="glass-input"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses ({leases.length})</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_ACCEPTANCE">Pending Acceptance</option>
            <option value="EXPIRED">Expired</option>
            <option value="DRAFT">Draft</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Leases Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading statutory leases…</p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No leases found matching current filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-card)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>LEASE NUMBER</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>PARCEL REFERENCE</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DEMISED AREA</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>TERM & EXPIRY</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ANNUAL RENT</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lease => {
                  const badge = getStatusBadge(lease.status, lease.endDate);
                  const daysLeft = computeDaysLeft(lease.endDate);

                  return (
                    <tr key={lease.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                        <div>{lease.leaseNumber}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          Since {lease.startDate ? new Date(lease.startDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                          {lease.parcel?.referenceNumber || 'Unassigned'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem' }}>
                        {lease.parcel?.areaHectares ? `${lease.parcel.areaHectares} ha` : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem' }}>
                        <div>{lease.termYears || 99} Years</div>
                        {lease.endDate && (
                          <div style={{ fontSize: '0.75rem', color: daysLeft && daysLeft < 90 ? 'var(--accent-400)' : 'var(--text-muted)' }}>
                            {daysLeft && daysLeft < 90 && daysLeft > 0 ? (
                              <span style={{ fontWeight: 700 }}>⚠️ Expiring in {daysLeft}d</span>
                            ) : daysLeft && daysLeft <= 0 ? (
                              <span style={{ fontWeight: 700, color: '#f87171' }}>Expired</span>
                            ) : (
                              `Ends ${new Date(lease.endDate).toLocaleDateString()}`
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-300)' }}>
                        ${lease.annualRentUsd?.toLocaleString()} {lease.currency || 'USD'}
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
                          whiteSpace: 'nowrap',
                        }}>
                          {badge.text}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Link
                            href={`/estates/leases/${lease.id}/print`}
                            target="_blank"
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            🖨️ Print Agreement
                          </Link>
                          <Link
                            href={`/verify/lease/${lease.leaseNumber}`}
                            target="_blank"
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          >
                            🔍 QR Verify
                          </Link>
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
    </div>
  );
}
