'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../components/AppContext';

interface WaitingListEntry {
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
  };
  clientProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    companyName?: string;
    verificationStatus: string;
  };
}

export default function EstatesWaitingListPage() {
  const { provinces } = useApp();
  const [entries, setEntries] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [provinceFilter, setProvinceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWaitingList();
  }, [provinceFilter, statusFilter]);

  async function fetchWaitingList() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (provinceFilter) params.append('provinceId', provinceFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/backend/api/v1/applications/waiting-list?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error('Failed to load waiting list', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredEntries = entries.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const wl = (item.waitingListNumber || '').toLowerCase();
    const appNum = (item.applicationNumber || '').toLowerCase();
    const applicant = `${item.clientProfile?.firstName || ''} ${item.clientProfile?.lastName || ''} ${item.clientProfile?.companyName || ''}`.toLowerCase();
    return wl.includes(q) || appNum.includes(q) || applicant.includes(q);
  });

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
            <Link href="/estates" style={{ color: 'var(--primary-400)', fontSize: '0.8125rem' }}>
              ← Estates Portal
            </Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>National Allocation Registry</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Master State Land Waiting List Monitor
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Auditable statutory chronological allocation queue across Zimbabwe's 10 administrative provinces.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => window.print()}
        >
          🖨️ Print Queue Roll
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px' }}>
          <input
            type="text"
            className="glass-input"
            placeholder="Search Waiting List No, App No, or Applicant Name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ width: '200px' }}>
          <select
            className="glass-input"
            value={provinceFilter}
            onChange={e => setProvinceFilter(e.target.value)}
          >
            <option value="">All Provinces (10)</option>
            {provinces.map(prov => (
              <option key={prov.id} value={prov.id}>{prov.name}</option>
            ))}
          </select>
        </div>

        <div style={{ width: '180px' }}>
          <select
            className="glass-input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted / In Queue</option>
            <option value="ALLOCATED">Allocated (Workbench)</option>
            <option value="OFFER_ISSUED">Offer Issued</option>
            <option value="APPROVED">Approved / Leased</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Queue Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading Master Waiting List…</p>
        ) : filteredEntries.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No waiting list entries match your search criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-card)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>WAITING LIST NO.</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>APPLICANT / ENTITY</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROVINCE</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>INTENDED USE</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>REQUESTED HA</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ALLOCATED PARCEL</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>LODGED ON</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((item, index) => {
                  const badge = getStatusBadge(item.status);
                  const provinceName = provinces.find(p => p.id === item.provinceId)?.name || 'National';

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        {item.waitingListNumber ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', width: '20px' }}>
                              #{index + 1}
                            </span>
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
                              {item.waitingListNumber}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>{item.applicationNumber}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>
                          {item.clientProfile ? `${item.clientProfile.firstName} ${item.clientProfile.lastName}` : 'Applicant Registered'}
                        </div>
                        {item.clientProfile?.companyName && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-400)' }}>
                            🏢 {item.clientProfile.companyName}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {provinceName}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem' }}>
                        {item.proposedLandUse.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem' }}>
                        {item.hectaresRequested ? `${item.hectaresRequested} ha` : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.875rem' }}>
                        {item.parcel ? (
                          <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                            {item.parcel.referenceNumber} ({item.parcel.areaHectares} ha)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>Unallocated</span>
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
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
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
