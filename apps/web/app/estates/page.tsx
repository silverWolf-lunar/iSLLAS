'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';
import { ZimbabweFlag } from '../components/ZimbabweFlag';

export default function EstatesDashboardPage() {
  const { currentUser, parcels, provinces } = useApp();
  const [waitingListCount, setWaitingListCount] = useState(0);
  const [leasesCount, setLeasesCount] = useState(0);
  const [activeLeasesCount, setActiveLeasesCount] = useState(0);
  const [totalAnnualRent, setTotalAnnualRent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEstatesOverview() {
      try {
        setLoading(true);
        const [wlRes, leasesRes] = await Promise.allSettled([
          fetch('/api/backend/api/v1/applications/waiting-list'),
          fetch('/api/backend/api/v1/leases'),
        ]);

        if (wlRes.status === 'fulfilled' && wlRes.value.ok) {
          const wl = await wlRes.value.json();
          const items = Array.isArray(wl) ? wl : (wl.data || []);
          setWaitingListCount(items.length);
        }

        if (leasesRes.status === 'fulfilled' && leasesRes.value.ok) {
          const l = await leasesRes.value.json();
          const items = Array.isArray(l) ? l : (l.data || []);
          setLeasesCount(items.length);
          const active = items.filter((item: any) => item.status === 'ACTIVE');
          setActiveLeasesCount(active.length);
          const rentSum = items.reduce((sum: number, item: any) => sum + (Number(item.annualRentUsd) || 0), 0);
          setTotalAnnualRent(rentSum);
        }
      } catch (err) {
        console.error('Failed to load estates overview', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEstatesOverview();
  }, []);

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
              background: 'rgba(217, 119, 6, 0.2)',
              color: 'var(--accent-400)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
            }}>
              ESTATES MANAGEMENT DIVISION
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <ZimbabweFlag width={16} height={10} />
              <span>National State Land Portfolio &amp; Revenue</span>
            </div>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: 'var(--text-main)', margin: '0 0 6px' }}>
            Estates Officer Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '640px', margin: 0 }}>
            Oversee Zimbabwe's national land waiting list queue, manage 99-year agricultural lease contracts, and issue statutory legal agreements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/estates/waiting-list" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            Master Waiting List
          </Link>
          <Link href="/estates/leases" className="btn btn-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Statutory Leases
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stat-grid">
        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div className="stat-label">National Waiting List Queue</div>
          <div className="stat-value" style={{ color: 'var(--accent-400)' }}>
            {waitingListCount}
          </div>
          <div className="stat-trend">
            <span>Citizens & enterprises awaiting parcel matching</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
          <div className="stat-label">Active 99-Year Leases</div>
          <div className="stat-value" style={{ color: 'var(--primary-400)' }}>
            {activeLeasesCount}
          </div>
          <div className="stat-trend" style={{ color: 'var(--primary-400)' }}>
            <span>{leasesCount} total lease agreements issued</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Annual Assessed Ground Rent</div>
          <div className="stat-value" style={{ color: '#ffffff' }}>
            ${totalAnnualRent.toLocaleString()} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>USD</span>
          </div>
          <div className="stat-trend">
            <span>Consolidated national revenue roll</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Provincial Land Reserves</div>
          <div className="stat-value">{provinces.length}</div>
          <div className="stat-trend">
            <span>10 Administrative Provinces Tracked</span>
          </div>
        </div>
      </div>

      {/* Workflow Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-400)' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <h3 style={{ fontSize: '1.125rem' }}>Master Waiting List Monitor</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Audit national allocation queues across all 10 provinces. Filter by agricultural sector, applicant score, and inspect timeline seniority.
            </p>
          </div>
          <Link href="/estates/waiting-list" className="btn btn-primary" style={{ width: '100%' }}>
            Audit Waiting List Queue
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 style={{ fontSize: '1.125rem' }}>Statutory 99-Year Leases</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Generate, manage, and print official Republic of Zimbabwe lease agreements formatted with statutory legal clauses and seal emblems.
            </p>
          </div>
          <Link href="/estates/leases" className="btn btn-accent" style={{ width: '100%' }}>
            Manage Leases ({leasesCount})
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 style={{ fontSize: '1.125rem' }}>Operational Reports</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Examine operational land delivery statistics, lease conversion rates, and revenue collection audits across all administrative districts.
            </p>
          </div>
          <Link href="/reports" className="btn btn-outline" style={{ width: '100%' }}>
            View National Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
