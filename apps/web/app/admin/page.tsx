'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';
import { ZimbabweFlag } from '../components/ZimbabweFlag';

interface UserCountSummary {
  total: number;
  byRole: Record<string, number>;
}

export default function AdminDashboardPage() {
  const { parcels, provinces } = useApp();
  const [usersSummary, setUsersSummary] = useState<UserCountSummary>({ total: 0, byRole: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsersSummary();
  }, []);

  async function fetchUsersSummary() {
    try {
      setLoading(true);
      const res = await fetch('/api/backend/api/v1/users');
      if (res.ok) {
        const payload = await res.json();
        const usersList: any[] = Array.isArray(payload) ? payload : (payload.data || []);
        const byRole: Record<string, number> = {};
        for (const u of usersList) {
          const r = u.role || 'CLIENT';
          byRole[r] = (byRole[r] || 0) + 1;
        }
        setUsersSummary({
          total: usersList.length,
          byRole,
        });
      }
    } catch (err) {
      console.error('Failed to load users summary', err);
    } finally {
      setLoading(false);
    }
  }

  const totalHectares = parcels.reduce((sum, p) => sum + (p.areaHectares || 0), 0);
  const availableParcels = parcels.filter(p => p.status === 'AVAILABLE');
  const availableHectares = availableParcels.reduce((sum, p) => sum + (p.areaHectares || 0), 0);
  const pendingParcels = parcels.filter(p => p.status === 'PENDING_VERIFICATION');

  return (
    <div className="page-stack">
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              SYSTEM ADMINISTRATOR CONSOLE
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <ZimbabweFlag width={16} height={10} />
              <span>National Governance &amp; Security Oversight</span>
            </div>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: 'var(--text-main)', margin: '0 0 6px' }}>
            System Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '640px', margin: 0 }}>
            Manage staff identities, provincial registry offices, PostGIS spatial data integrity, and compliance policies across Zimbabwe.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/admin/users" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            User Management CRUD
          </Link>
          <Link href="/admin/offices" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Registry Offices
          </Link>
          <Link href="/audit" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Security Audit Trail
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="stat-grid">
        {/* Total Users */}
        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="stat-label">Platform Users (All Roles)</div>
          <div className="stat-value" style={{ color: '#f87171' }}>
            {loading ? '…' : usersSummary.total}
          </div>
          <div className="stat-trend" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <span>
              {usersSummary.byRole['CLIENT'] || 0} Farmers • {usersSummary.byRole['REGISTRY_OFFICER'] || 0} Officers • {usersSummary.byRole['APPROVER'] || 0} Approvers
            </span>
          </div>
        </div>

        {/* Registered Parcels */}
        <div className="glass-panel stat-card">
          <div className="stat-label">Total Cadastre Parcels</div>
          <div className="stat-value">{parcels.length}</div>
          <div className="stat-trend">
            <span>{totalHectares.toLocaleString()} hectares mapped</span>
          </div>
        </div>

        {/* Available Land */}
        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
          <div className="stat-label">Available Farmland</div>
          <div className="stat-value" style={{ color: 'var(--primary-400)' }}>
            {availableHectares.toLocaleString()} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ha</span>
          </div>
          <div className="stat-trend" style={{ color: 'var(--primary-400)' }}>
            <span>{availableParcels.length} verified idle parcels open</span>
          </div>
        </div>

        {/* Administrative Provinces */}
        <div className="glass-panel stat-card">
          <div className="stat-label">Provincial Coverage</div>
          <div className="stat-value">{provinces.length || 10}</div>
          <div className="stat-trend">
            <span>10 Provincial & 60 District Stations</span>
          </div>
        </div>
      </div>

      {/* Main Admin Modules Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginTop: '12px',
      }}>
        {/* User Management Module */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}>
                👥
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  User & Staff Identity Management
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Full CRUD & Role Assignments
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              Provision Ministry staff, assign administrative roles (Officers, Approvers, Estates, Auditors), configure district jurisdictions, and activate or suspend accounts.
            </p>
          </div>
          <Link href="/admin/users" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
            Open User Management →
          </Link>
        </div>

        {/* Registry Offices Module */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}>
                🏢
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  Registry & Provincial Offices
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sub-national Jurisdictions
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              Manage provincial registry stations (Chinhoyi, Marondera, Gweru, Mutare, Masvingo, Lupane, Gwanda, Bindura) and allocate officer staffing quotas.
            </p>
          </div>
          <Link href="/admin/offices" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
            Manage Registry Offices →
          </Link>
        </div>

        {/* Security & Audit Module */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}>
                🛡️
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  Statutory Audit & Anti-Corruption
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Immutable Append-Only Log
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              Inspect cryptographic audit events, track allocation approvals, detect segregation-of-duties violations, and review historical user actions.
            </p>
          </div>
          <Link href="/audit" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
            View Audit Trail →
          </Link>
        </div>

        {/* Cadastre GIS Explorer */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.15)',
                color: 'var(--primary-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}>
                🗺️
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  Spatial Cadastre Engine
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  PostGIS SRID 4326
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              Explore the interactive cadastre map, verify polygon boundaries, detect overlaps with protected forest reserves, and import GIS Shapefiles or GeoJSON.
            </p>
          </div>
          <Link href="/parcels" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
            Open Cadastre Explorer →
          </Link>
        </div>

        {/* Executive Reports */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}>
                📊
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  National Land Reports
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Analytical Insights & Allocations
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              Generate statutory reports on provincial land utilization, youth and women allocation quotas, 99-year lease revenue, and waiting list queue trends.
            </p>
          </div>
          <Link href="/reports" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
            Open Executive Reports →
          </Link>
        </div>

        {/* System Settings */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(100, 116, 139, 0.2)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}>
                ⚙️
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  Platform Settings & Infrastructure
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Integrations & Configurations
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              Inspect Keycloak OIDC authentication parameters, ZIMRA tax gateway configuration, automated email/SMS dispatch, and system backup schedules.
            </p>
          </div>
          <Link href="/settings" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
            Configure Settings →
          </Link>
        </div>
      </div>

      {/* System Health Strip */}
      <div className="glass-panel" style={{
        marginTop: '20px',
        padding: '18px 24px',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.8125rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <strong style={{ color: '#ffffff' }}>System Telemetry:</strong> All national services operational
        </div>
        <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span>PostgreSQL + PostGIS: <strong style={{ color: '#22c55e' }}>ONLINE (SRID 4326)</strong></span>
          <span>NestJS API: <strong style={{ color: '#22c55e' }}>ONLINE (v0.2.0)</strong></span>
          <span>Security Protocol: <strong style={{ color: '#22c55e' }}>STRICT RBAC</strong></span>
        </div>
      </div>
    </div>
  );
}
