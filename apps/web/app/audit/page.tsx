'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface AuditRecord {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  payload?: any;
  ipAddress?: string;
  createdAt: string;
}

export default function AuditLogViewerPage() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const res = await fetch('/api/backend/api/v1/audit-events');
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    if (actionFilter && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const action = log.action.toLowerCase();
    const entity = (log.entityType || '').toLowerCase();
    const user = (log.userId || '').toLowerCase();
    return action.includes(q) || entity.includes(q) || user.includes(q);
  });

  return (
    <div className="page-stack">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}>
              INDEPENDENT AUDIT TRAIL
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Statutory Integrity Log</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            System-Wide Audit & Provenance Trail
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Immutable chronological record of parcel registrations, KYC validations, allocations, approvals, and lease covenant issuances.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={fetchLogs}
        >
          🔄 Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 260px' }}>
          <input
            type="text"
            className="glass-input"
            placeholder="Search action, entity type, or user ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ width: '220px' }}>
          <select
            className="glass-input"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="APPLICATION">Application Events</option>
            <option value="ALLOCAT">Allocation Events</option>
            <option value="LEASE">Lease Events</option>
            <option value="PARCEL">Parcel Events</option>
            <option value="USER">User Events</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading audit records…</p>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No audit records found matching query.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-card)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>TIMESTAMP</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTION</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ENTITY TYPE</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ENTITY ID</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTOR</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>PAYLOAD</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(168, 85, 247, 0.15)',
                        color: '#c084fc',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                      {log.entityType || '—'}
                    </td>
                    <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {log.entityId ? `${log.entityId.slice(0, 12)}…` : '—'}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {log.userId ? `${log.userId.slice(0, 10)}…` : 'SYSTEM'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {log.payload ? (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => setSelectedRecord(log)}
                        >
                          Inspect JSON
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Empty</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: JSON Payload Inspector */}
      {selectedRecord && (
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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '28px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 600 }}>EVENT AUDIT PAYLOAD</span>
                <h3 style={{ fontSize: '1.125rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {selectedRecord.action}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Recorded on {new Date(selectedRecord.createdAt).toUTCString()}
            </div>

            <pre style={{
              background: '#090d16',
              padding: '16px',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              color: 'var(--primary-300)',
              overflowX: 'auto',
              border: '1px solid var(--border-subtle)',
            }}>
              {JSON.stringify(selectedRecord.payload, null, 2)}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
