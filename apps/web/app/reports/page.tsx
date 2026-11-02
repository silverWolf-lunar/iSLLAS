'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';

interface ProvinceIdleSummary {
  provinceId: string;
  provinceName: string;
  totalParcels: number;
  idleParcels: number;
  totalHectares: number;
  idleHectares: number;
  utilizationRate: number;
}

interface LeaseExpiryForecastItem {
  month: string;
  count: number;
}

export default function OperationalReportsPage() {
  const { parcels, provinces } = useApp();
  const [waitingListCount, setWaitingListCount] = useState(0);
  const [leasesCount, setLeasesCount] = useState(0);
  const [totalRentUsd, setTotalRentUsd] = useState(0);
  const [idleLandData, setIdleLandData] = useState<ProvinceIdleSummary[]>([]);
  const [expiryForecast, setExpiryForecast] = useState<LeaseExpiryForecastItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        const [wlRes, leasesRes, idleRes, dashRes] = await Promise.allSettled([
          fetch('/api/backend/api/v1/applications/waiting-list'),
          fetch('/api/backend/api/v1/leases'),
          fetch('/api/backend/api/v1/reports/idle-land'),
          fetch('/api/backend/api/v1/reports/dashboard'),
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

        if (idleRes.status === 'fulfilled' && idleRes.value.ok) {
          const idle = await idleRes.value.json();
          if (idle && Array.isArray(idle.provinces)) {
            setIdleLandData(idle.provinces);
          } else if (Array.isArray(idle)) {
            setIdleLandData(idle);
          }
        }

        if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
          const dash = await dashRes.value.json();
          if (dash?.leaseExpiryForecast && Array.isArray(dash.leaseExpiryForecast)) {
            setExpiryForecast(dash.leaseExpiryForecast);
          }
        }
      } catch (err) {
        console.error('Failed to load report data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, []);

  // Compute metrics from backend or local fallback
  const totalHectares = parcels.reduce((sum, p) => sum + p.areaHectares, 0);
  const availableParcels = parcels.filter(p => p.status === 'AVAILABLE');
  const availableHectares = availableParcels.reduce((sum, p) => sum + p.areaHectares, 0);
  const leasedParcels = parcels.filter(p => p.status === 'LEASED' || p.status === 'ALLOCATED');
  const leasedHectares = leasedParcels.reduce((sum, p) => sum + p.areaHectares, 0);

  // If backend idle report is available, use it; otherwise build from context
  const provincialRows: ProvinceIdleSummary[] = idleLandData.length > 0
    ? idleLandData
    : provinces.map(prov => {
        const provParcels = parcels.filter(p => p.province === prov.name || p.province === prov.id);
        const provArea = provParcels.reduce((sum, p) => sum + p.areaHectares, 0);
        const provAvail = provParcels.filter(p => p.status === 'AVAILABLE').reduce((sum, p) => sum + p.areaHectares, 0);
        const provIdleCount = provParcels.filter(p => p.status === 'AVAILABLE').length;
        const utilization = provArea > 0 ? Math.round(((provArea - provAvail) / provArea) * 100) : 0;
        return {
          provinceId: prov.id,
          provinceName: prov.name,
          totalParcels: provParcels.length,
          idleParcels: provIdleCount,
          totalHectares: provArea,
          idleHectares: provAvail,
          utilizationRate: utilization,
        };
      });

  const totalIdleHectares = provincialRows.reduce((acc, r) => acc + r.idleHectares, 0);
  const totalIdleParcels = provincialRows.reduce((acc, r) => acc + r.idleParcels, 0);

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
            National monitoring for idle agricultural land identification, settlement schemes, and statutory lease tracking across Zimbabwe.
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

        {/* Objective 1 KPI: Idle Land */}
        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <div className="stat-label">Identified Idle Land</div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>
            {(totalIdleHectares || availableHectares).toLocaleString()} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ha</span>
          </div>
          <div className="stat-trend" style={{ color: '#38bdf8' }}>
            <span>{totalIdleParcels || availableParcels.length} idle/available parcels for allocation</span>
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
            <span>{leasesCount || leasedParcels.length} active 99-year leases</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <div className="stat-label">Annual Ground Revenue</div>
          <div className="stat-value" style={{ color: '#60a5fa' }}>
            ${totalRentUsd.toLocaleString()} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>USD</span>
          </div>
          <div className="stat-trend">
            <span>Statutory lease roll receivables</span>
          </div>
        </div>
      </div>

      {/* Objective 3: Lease Expiry Tracking Forecast */}
      {expiryForecast.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <span>📅</span> 6-Month Statutory Lease Expiry Forecast
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '4px 0 0 0' }}>
                Anticipated 99-year lease renewals and expiry audit windows requiring notification under the Land Commission Act.
              </p>
            </div>
            <Link href="/estates/leases" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
              View Lease Roll →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {expiryForecast.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: item.count > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {item.month}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.count > 0 ? 'var(--accent-400)' : '#ffffff', margin: '8px 0 4px 0' }}>
                  {item.count}
                </div>
                <div style={{ fontSize: '0.6875rem', color: item.count > 0 ? 'var(--accent-400)' : 'var(--text-dim)' }}>
                  {item.count === 1 ? '1 lease expiring' : `${item.count} leases expiring`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Objective 1: Provincial Idle Land & Cadastre Distribution Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🏛️</span> Provincial Idle Land & Cadastre Distribution
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '4px 0 0 0' }}>
              Identification of idle and available state land across Zimbabwean provinces for settlement and allocation.
            </p>
          </div>
          <Link href="/officer/allocate" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
            + Allocate Idle Land
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-card)' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROVINCE</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL PARCELS</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>IDLE PARCELS</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL EXTENT</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>AVAILABLE IDLE LAND</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>UTILIZATION RATE</th>
              </tr>
            </thead>
            <tbody>
              {provincialRows.map((prov) => {
                const provCode = provinces.find(p => p.name === prov.provinceName || p.id === prov.provinceId)?.code || 'ZW';

                return (
                  <tr key={prov.provinceId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{prov.provinceName}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.6875rem',
                          color: 'var(--accent-400)',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '3px',
                        }}>
                          {provCode}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                      {prov.totalParcels}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: prov.idleParcels > 0 ? '#38bdf8' : 'var(--text-muted)', fontWeight: prov.idleParcels > 0 ? 600 : 400 }}>
                      {prov.idleParcels}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                      {prov.totalHectares.toLocaleString()} ha
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: prov.idleHectares > 0 ? 'var(--primary-400)' : 'var(--text-muted)', fontWeight: prov.idleHectares > 0 ? 600 : 400 }}>
                      {prov.idleHectares.toLocaleString()} ha
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, Math.max(0, prov.utilizationRate))}%`, height: '100%', background: 'var(--primary-400)' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '42px', textAlign: 'right' }}>
                          {prov.utilizationRate}%
                        </span>
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
