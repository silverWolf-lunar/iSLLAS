'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';

export default function OperationalReportsPage() {
  const { parcels, provinces } = useApp();
  const [waitingListCount, setWaitingListCount] = useState(0);
  const [leasesCount, setLeasesCount] = useState(0);
  const [totalRentUsd, setTotalRentUsd] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        const [wlRes, leasesRes] = await Promise.allSettled([
          fetch('/api/backend/api/v1/applications/waiting-list'),
          fetch('/api/backend/api/v1/leases'),
        ]);

        if (wlRes.status === 'fulfilled' && wlRes.value.ok) {
          const wl = await wlRes.value.json();
          setWaitingListCount(Array.isArray(wl) ? wl.length : (wl.data?.length || 0));
        }

        if (leasesRes.status === 'fulfilled' && leasesRes.value.ok) {
          const l = await leasesRes.value.json();
          const items = Array.isArray(l) ? l : (l.data || []);
          setLeasesCount(items.length);
          const sum = items.reduce((acc: number, item: any) => acc + (Number(item.annualRentUsd) || 0), 0);
          setTotalRentUsd(sum);
        }
      } catch (err) {
        console.error('Failed to load report data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, []);

  const totalHectares = parcels.reduce((sum, p) => sum + p.areaHectares, 0);
  const availableParcels = parcels.filter(p => p.status === 'AVAILABLE');
  const availableHectares = availableParcels.reduce((sum, p) => sum + p.areaHectares, 0);
  const leasedParcels = parcels.filter(p => p.status === 'LEASED' || p.status === 'ALLOCATED');
  const leasedHectares = leasedParcels.reduce((sum, p) => sum + p.areaHectares, 0);

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
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              NATIONAL LAND INTELLIGENCE
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Operational Cadastre & Land Delivery Report
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Executive Operational & Provincial Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Performance metrics across agricultural settlement schemes, land utilization, and statutory leasehold revenues.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => window.print()}
        >
          🖨️ Export PDF Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
          <div className="stat-label">Total Cadastre Extent</div>
          <div className="stat-value" style={{ color: 'var(--primary-400)' }}>
            {totalHectares.toLocaleString()} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ha</span>
          </div>
          <div className="stat-trend">
            <span>{parcels.length} surveyed cadastre parcels</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div className="stat-label">National Land Demand</div>
          <div className="stat-value" style={{ color: 'var(--accent-400)' }}>
            {waitingListCount}
          </div>
          <div className="stat-trend" style={{ color: 'var(--accent-400)' }}>
            <span>Applicants in active statutory queue</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Leased Agricultural Land</div>
          <div className="stat-value">
            {leasedHectares.toLocaleString()} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ha</span>
          </div>
          <div className="stat-trend">
            <span>{leasedParcels.length} active 99-year leases</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <div className="stat-label">Annual Ground Revenue</div>
          <div className="stat-value" style={{ color: '#60a5fa' }}>
            ${totalRentUsd.toLocaleString()} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>USD</span>
          </div>
          <div className="stat-trend">
            <span>{leasesCount} statutory lease rolls</span>
          </div>
        </div>
      </div>

      {/* Provincial Breakdown Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.125rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏛️</span> Provincial Cadastre & Allocation Distribution
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-card)' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROVINCE</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>CODE</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>PARCELS</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL EXTENT</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>AVAILABLE IDLE LAND</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>UTILIZATION RATE</th>
              </tr>
            </thead>
            <tbody>
              {provinces.map(prov => {
                const provParcels = parcels.filter(p => p.province === prov.name || p.province === prov.id);
                const provArea = provParcels.reduce((sum, p) => sum + p.areaHectares, 0);
                const provAvail = provParcels.filter(p => p.status === 'AVAILABLE').reduce((sum, p) => sum + p.areaHectares, 0);
                const utilization = provArea > 0 ? Math.round(((provArea - provAvail) / provArea) * 100) : 0;

                return (
                  <tr key={prov.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>
                      {prov.name}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--accent-400)' }}>
                      {prov.code}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                      {provParcels.length}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                      {provArea.toLocaleString()} ha
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--primary-400)' }}>
                      {provAvail.toLocaleString()} ha
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${utilization}%`, height: '100%', background: 'var(--primary-400)' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '36px' }}>{utilization}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
