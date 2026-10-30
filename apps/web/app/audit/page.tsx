'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';
import { ZimbabweFlag } from '../components/ZimbabweFlag';
import { Role } from '@sllas/contracts';

interface AuditRecord {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  userId?: string;
  metadata?: Record<string, any>;
  payload?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  createdAt: string;
}

export default function AuditLogViewerPage() {
  const { currentUser, switchDevRole } = useApp();
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [switchingRole, setSwitchingRole] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [currentUser?.role]);

  async function fetchLogs() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/backend/api/v1/audit-events');

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const message =
          errJson.error?.message ||
          errJson.message ||
          (res.status === 403
            ? 'Access restricted: Independent audit trail requires SYSTEM_ADMIN or AUDITOR role credentials.'
            : `HTTP ${res.status}: Failed to fetch audit events.`);
        setErrorMsg(message);
        setLogs([]);
        return;
      }

      const payload = await res.json();

      // Safely extract the events array from various possible wrapper schemas
      let eventList: AuditRecord[] = [];
      let count = 0;

      if (Array.isArray(payload)) {
        eventList = payload;
        count = payload.length;
      } else if (Array.isArray(payload?.data)) {
        eventList = payload.data;
        count = payload.data.length;
      } else if (Array.isArray(payload?.data?.events)) {
        eventList = payload.data.events;
        count = payload.data.count || payload.data.events.length;
      } else if (Array.isArray(payload?.events)) {
        eventList = payload.events;
        count = payload.count || payload.events.length;
      }

      setLogs(eventList);
      setTotalCount(count || eventList.length);
    } catch (err: any) {
      console.error('Failed to load audit logs', err);
      setErrorMsg(err.message || 'Network error encountered whilst retrieving audit provenance trail.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  const handleRoleElevate = async (targetRole: Role) => {
    try {
      setSwitchingRole(true);
      await switchDevRole(targetRole);
      await fetchLogs();
    } finally {
      setSwitchingRole(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];

    return logs.filter(log => {
      if (actionFilter && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const action = (log.action || '').toLowerCase();
      const entity = (log.entityType || '').toLowerCase();
      const actor = (log.actorEmail || log.actorId || log.userId || '').toLowerCase();
      const role = (log.actorRole || '').toLowerCase();
      const entityId = (log.entityId || '').toLowerCase();

      return (
        action.includes(q) ||
        entity.includes(q) ||
        actor.includes(q) ||
        role.includes(q) ||
        entityId.includes(q)
      );
    });
  }, [logs, actionFilter, searchQuery]);

  const uniqueActorsCount = useMemo(() => {
    const actors = new Set<string>();
    logs.forEach(l => {
      const id = l.actorEmail || l.actorId || l.userId;
      if (id) actors.add(id);
    });
    return actors.size;
  }, [logs]);

  const uniqueEntitiesCount = useMemo(() => {
    const entities = new Set<string>();
    logs.forEach(l => {
      if (l.entityType) entities.add(l.entityType);
    });
    return entities.size;
  }, [logs]);

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('ALLOCAT')) {
      return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.35)' };
    }
    if (act.includes('VERIFY') || act.includes('INSPECT')) {
      return { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.35)' };
    }
    if (act.includes('APPROV')) {
      return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.35)' };
    }
    if (act.includes('REJECT') || act.includes('DISPUT')) {
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#fca5a5', border: 'rgba(239, 68, 68, 0.35)' };
    }
    if (act.includes('UPDATE') || act.includes('LEASE')) {
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)' };
    }
    return { bg: 'rgba(100, 116, 139, 0.15)', text: '#cbd5e1', border: 'rgba(100, 116, 139, 0.35)' };
  };

  const isAccessDenied =
    Boolean(errorMsg?.includes('Access restricted') || errorMsg?.includes('403')) ||
    (currentUser && currentUser.role !== Role.AUDITOR && currentUser.role !== Role.SYSTEM_ADMIN);

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
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}>
              INDEPENDENT AUDIT TRAIL
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <ZimbabweFlag width={16} height={10} />
              <span>Statutory Compliance &amp; Provenance Directorate</span>
            </div>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: 'var(--text-main)', margin: '0 0 6px' }}>
            System-Wide Audit &amp; Provenance Trail
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '680px', margin: 0 }}>
            Immutable chronological record of parcel registrations, KYC validations, waiting list scoring, board allocations, and 99-year lease issuances.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            onClick={fetchLogs}
            disabled={loading}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing…' : 'Refresh Audit Log'}
          </button>
        </div>
      </div>

      {/* Role Restriction Banner if unauthorized */}
      {isAccessDenied && (
        <div className="glass-panel" style={{
          padding: '20px 24px',
          background: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#fbbf24',
            }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 style={{ color: 'var(--accent-400)', fontSize: '0.9375rem', marginBottom: '2px', fontWeight: 700 }}>
                Statutory Access Control Enforcement (Cap 20:01 &amp; PFMA)
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
                The Independent Audit Trail contains legally binding forensic logs restricted to <strong>SYSTEM_ADMIN</strong> and <strong>AUDITOR</strong> authorities.
                Your current active role is: <strong>{currentUser?.role || 'Guest'}</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-accent"
              disabled={switchingRole}
              onClick={() => handleRoleElevate(Role.AUDITOR)}
              style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
            >
              {switchingRole ? 'Switching…' : 'Switch to Auditor Authority'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={switchingRole}
              onClick={() => handleRoleElevate(Role.SYSTEM_ADMIN)}
              style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
            >
              Switch to Administrator
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="stat-grid">
        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}>
          <div className="stat-label">Total Provenance Logs</div>
          <div className="stat-value" style={{ color: '#c084fc' }}>
            {loading ? '…' : totalCount}
          </div>
          <div className="stat-trend">
            <span>Append-only immutable record roll</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
          <div className="stat-label">Monitored Entities</div>
          <div className="stat-value" style={{ color: 'var(--primary-400)' }}>
            {loading ? '…' : uniqueEntitiesCount}
          </div>
          <div className="stat-trend" style={{ color: 'var(--primary-400)' }}>
            <span>Parcels, profiles, applications &amp; leases</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Unique System Actors</div>
          <div className="stat-value">
            {loading ? '…' : uniqueActorsCount}
          </div>
          <div className="stat-trend">
            <span>Verified state officers &amp; automated daemons</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Cryptographic Integrity</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
            SHA-256 WAL
          </div>
          <div className="stat-trend">
            <span>PostgreSQL Write-Ahead Log Verified</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 280px' }}>
          <input
            type="text"
            className="glass-input"
            placeholder="Search action, entity type, actor email, or entity UUID..."
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
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="VERIFY">VERIFY</option>
            <option value="ALLOCAT">ALLOCATE</option>
            <option value="APPROV">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="LEASE">LEASE</option>
            <option value="UPLOAD">UPLOAD</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="data-table-container">
        {loading ? (
          <p style={{ padding: '32px', color: 'var(--text-muted)', textAlign: 'center' }}>Loading statutory audit records…</p>
        ) : errorMsg && logs.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#fca5a5' }}>
            <p style={{ fontWeight: 600, marginBottom: '6px' }}>Unable to Display Audit Records</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>{errorMsg}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No audit records found matching your filter criteria.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>ACTION</th>
                <th>ENTITY TYPE</th>
                <th>ENTITY IDENTIFIER</th>
                <th>ACTOR / IDENTITY</th>
                <th>ACTOR ROLE</th>
                <th>METADATA PAYLOAD</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const badge = getActionBadgeColor(log.action);
                const metadataObj = log.metadata || log.payload;

                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        display: 'inline-block',
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {log.entityType || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {log.entityId ? `${log.entityId.slice(0, 14)}…` : '—'}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                      {log.actorEmail ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{log.actorEmail}</div>
                          {log.actorId && (
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                              {log.actorId.slice(0, 8)}…
                            </div>
                          )}
                        </div>
                      ) : log.actorId ? (
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{log.actorId.slice(0, 10)}…</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>SYSTEM</span>
                      )}
                    </td>
                    <td>
                      {log.actorRole ? (
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)',
                        }}>
                          {log.actorRole}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      {metadataObj && Object.keys(metadataObj).length > 0 ? (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => setSelectedRecord(log)}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                          Inspect JSON ({Object.keys(metadataObj).length})
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Empty</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: JSON Metadata Payload Inspector */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', padding: '28px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700, letterSpacing: '0.05em' }}>
                  STATUTORY EVENT AUDIT METADATA
                </span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
                  {selectedRecord.action} • {selectedRecord.entityType || 'ENTITY'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.8125rem',
            }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.6875rem' }}>ENTITY ID</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{selectedRecord.entityId || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.6875rem' }}>ACTOR</span>
                <span style={{ color: 'var(--text-main)' }}>{selectedRecord.actorEmail || selectedRecord.actorId || 'SYSTEM'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.6875rem' }}>LOGGED AT</span>
                <span style={{ color: 'var(--text-main)' }}>{new Date(selectedRecord.createdAt).toUTCString()}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.6875rem' }}>IP ADDRESS</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{selectedRecord.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>

            <pre style={{
              background: '#090d16',
              padding: '18px',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              color: 'var(--primary-300)',
              overflowX: 'auto',
              border: '1px solid var(--border-subtle)',
              lineHeight: 1.5,
            }}>
              {JSON.stringify(selectedRecord.metadata || selectedRecord.payload || {}, null, 2)}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedRecord(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
