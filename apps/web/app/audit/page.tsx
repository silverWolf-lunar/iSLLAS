'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';
import { ZimbabweFlag } from '../components/ZimbabweFlag';

interface AuditItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  provinceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export default function SecurityAuditTrailPage() {
  const { currentUser } = useApp();
  const [events, setEvents] = useState<AuditItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditEvents();
  }, [selectedEntity]);

  async function fetchAuditEvents() {
    try {
      setLoading(true);
      setErrorMsg(null);
      const query = new URLSearchParams();
      if (selectedEntity !== 'ALL') {
        query.set('entityType', selectedEntity);
      }
      query.set('limit', '100');

      const res = await fetch(`/api/backend/api/v1/audit-events?${query.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Unable to retrieve audit ledger');
      }

      const payload = await res.json();
      const rawEvents: AuditItem[] = payload?.events || (Array.isArray(payload) ? payload : (payload.data || []));
      setEvents(rawEvents);
      setTotalCount(payload?.count ?? rawEvents.length);
    } catch (err: any) {
      console.warn('Audit fetch warning', err);
      setErrorMsg(err.message || 'Audit trail connection error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = events.filter(e => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.action?.toLowerCase().includes(term) ||
      e.entityType?.toLowerCase().includes(term) ||
      e.entityId?.toLowerCase().includes(term) ||
      e.actorEmail?.toLowerCase().includes(term) ||
      e.actorRole?.toLowerCase().includes(term)
    );
  });

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('APPROVE') || act.includes('VERIFY')) {
      return { bg: 'rgba(34, 197, 94, 0.2)', color: 'var(--primary-400)', border: 'rgba(34, 197, 94, 0.4)' };
    }
    if (act.includes('REJECT') || act.includes('DELETE') || act.includes('WITHDRAW')) {
      return { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
    }
    if (act.includes('CREATE') || act.includes('SUBMIT')) {
      return { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' };
    }
    return { bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-400)', border: 'rgba(245, 158, 11, 0.4)' };
  };

  const backLink = currentUser?.role === 'REGISTRY_OFFICER' ? '/officer' : '/admin';
  const backLabel = currentUser?.role === 'REGISTRY_OFFICER' ? '← Back to Officer Portal' : '← Back to Admin Console';

  return (
    <div className="page-stack">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href={backLink} style={{ color: 'var(--primary-400)', fontSize: '0.8125rem' }}>
              {backLabel}
            </Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Statutory Audit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.75rem', color: '#ffffff', margin: 0 }}>
              Security &amp; Compliance Audit Trail
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}>
              IMMUTABLE APPEND-ONLY
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>
            Cryptographically audited record of all state land allocations, reviews, lease generation deeds, and security events.
          </p>
        </div>

        <button onClick={fetchAuditEvents} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Log
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Filter by action, entity ID, actor email..."
          className="glass-input"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ minWidth: '260px', flex: 1, padding: '8px 12px', fontSize: '0.875rem' }}
        />
        <select
          className="glass-input"
          value={selectedEntity}
          onChange={e => setSelectedEntity(e.target.value)}
          style={{ padding: '8px 12px', fontSize: '0.875rem' }}
        >
          <option value="ALL">All Entity Types</option>
          <option value="LEASE_APPLICATION">Lease Applications</option>
          <option value="PARCEL">Land Parcels</option>
          <option value="LEASE">99-Year Leases</option>
          <option value="CLIENT_PROFILE">Client Profiles / KYC</option>
          <option value="USER">User Identities</option>
          <option value="SYSTEM">System Events</option>
        </select>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Total logged events: <strong style={{ color: '#ffffff' }}>{totalCount || filtered.length}</strong>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Retrieving immutable audit records…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No audit events match the selected criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Timestamp</th>
                  <th style={{ padding: '10px' }}>Action</th>
                  <th style={{ padding: '10px' }}>Entity</th>
                  <th style={{ padding: '10px' }}>Entity ID</th>
                  <th style={{ padding: '10px' }}>Actor</th>
                  <th style={{ padding: '10px' }}>Role</th>
                  <th style={{ padding: '10px' }}>Details / Metadata</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const badge = getActionBadge(item.action || '');
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}>
                          {item.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontWeight: 600, color: '#ffffff' }}>
                        {item.entityType}
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>
                        {item.entityId ? (item.entityId.length > 18 ? `${item.entityId.slice(0, 14)}…` : item.entityId) : 'N/A'}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-main)' }}>
                        {item.actorEmail || item.actorId ? (item.actorEmail || `${item.actorId?.slice(0, 10)}…`) : 'System / Auto'}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                        {item.actorRole || 'SYSTEM'}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-dim)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.metadata ? JSON.stringify(item.metadata) : '—'}
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
