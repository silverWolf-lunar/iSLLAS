'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';

export default function OfficerDashboardPage() {
  const { currentUser, parcels, provinces } = useApp();
  const [applicantCount, setApplicantCount] = useState<number>(0);
  const [waitingListCount, setWaitingListCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOfficerMetrics() {
      try {
        setLoading(true);
        const [profilesRes, wlRes] = await Promise.allSettled([
          fetch('/api/backend/api/v1/client-profiles'),
          fetch('/api/backend/api/v1/applications/waiting-list'),
        ]);

        if (profilesRes.status === 'fulfilled' && profilesRes.value.ok) {
          const p = await profilesRes.value.json();
          setApplicantCount(Array.isArray(p) ? p.length : (p.data?.length || 0));
        }

        if (wlRes.status === 'fulfilled' && wlRes.value.ok) {
          const wl = await wlRes.value.json();
          setWaitingListCount(Array.isArray(wl) ? wl.length : (wl.data?.length || 0));
        }
      } catch (err) {
        console.error('Error fetching officer metrics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOfficerMetrics();
  }, []);

  const availableParcels = parcels.filter(p => p.status === 'AVAILABLE');
  const userProvince = provinces.find(p => p.id === currentUser?.provinceId)?.name || 'National Cadastre Jurisdiction';

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
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              REGISTRY OFFICER CONSOLE
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Jurisdiction: {userProvince}
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Land Registry & Cadastre Operations
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '640px' }}>
            Inspect applicant KYC portfolios, match verified citizens with surveyed idle parcels, and conduct formal land allocations.
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/officer/allocate" className="btn btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Allocation Workbench
          </Link>
          <Link href="/officer/applicants" className="btn btn-accent">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Review Applicant KYC
          </Link>
          <Link href="/parcels" className="btn btn-outline">
            Cadastre Map
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stat-grid">
        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <div className="stat-label">Pending KYC Reviews</div>
          <div className="stat-value" style={{ color: '#60a5fa' }}>
            {applicantCount}
          </div>
          <div className="stat-trend">
            <span>Citizens waiting for statutory document review</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
          <div className="stat-label">Available Land Parcels</div>
          <div className="stat-value" style={{ color: 'var(--primary-400)' }}>
            {availableParcels.length}
          </div>
          <div className="stat-trend" style={{ color: 'var(--primary-400)' }}>
            <span>{availableParcels.reduce((s, p) => s + p.areaHectares, 0).toLocaleString()} ha ready for allocation</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div className="stat-label">Waiting List Demand</div>
          <div className="stat-value" style={{ color: 'var(--accent-400)' }}>
            {waitingListCount}
          </div>
          <div className="stat-trend" style={{ color: 'var(--accent-400)' }}>
            <span>Applications queued in your jurisdiction</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Cadastre Parcels</div>
          <div className="stat-value">{parcels.length}</div>
          <div className="stat-trend">
            <span>Total surveyed GIS boundaries</span>
          </div>
        </div>
      </div>

      {/* Workflow Navigation Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(22, 163, 74, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)', fontSize: '1.25rem' }}>
                ⚖️
              </div>
              <h3 style={{ fontSize: '1.125rem' }}>Allocation Workbench</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Execute statutory parcel allocations. Pair high-scoring verified applicants from the waiting list with idle surveyed parcels and set lease covenants.
            </p>
          </div>
          <Link href="/officer/allocate" className="btn btn-primary" style={{ width: '100%' }}>
            Launch Workbench
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-400)', fontSize: '1.25rem' }}>
                🪪
              </div>
              <h3 style={{ fontSize: '1.125rem' }}>Applicant KYC Review</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Inspect uploaded National IDs, Tax Clearance certificates, and company incorporation files to verify citizen eligibility.
            </p>
          </div>
          <Link href="/officer/applicants" className="btn btn-accent" style={{ width: '100%' }}>
            Open Review Queue ({applicantCount})
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontSize: '1.25rem' }}>
                🗺️
              </div>
              <h3 style={{ fontSize: '1.125rem' }}>Cadastre Management</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Inspect GIS polygon boundaries, check spatial overlaps, register newly demarcated farms, and manage zoning classifications.
            </p>
          </div>
          <Link href="/parcels" className="btn btn-outline" style={{ width: '100%' }}>
            Explore Cadastre Map
          </Link>
        </div>
      </div>
    </div>
  );
}
