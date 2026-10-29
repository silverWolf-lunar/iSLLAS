'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';

interface ClientProfile {
  id: string;
  fullName?: string;
  nationalId?: string;
  verificationStatus: string;
  companyName?: string;
  documents?: Array<{
    id: string;
    type: string;
    fileName: string;
    uploadedAt: string;
    status: string;
  }>;
}

interface ApplicationItem {
  id: string;
  applicationNumber: string;
  waitingListNumber?: string;
  status: string;
  createdAt: string;
  proposedLandUse: string;
  parcel?: { referenceNumber: string; areaHectares: number };
}

interface LeaseItem {
  id: string;
  leaseNumber: string;
  status: string;
  startDate: string;
  annualRentUsd: number;
}

export default function ClientDashboardPage() {
  const { currentUser } = useApp();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [leases, setLeases] = useState<LeaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClientData() {
      try {
        setLoading(true);
        const [profileRes, appsRes, leasesRes] = await Promise.allSettled([
          fetch('/api/backend/api/v1/client-profiles/me'),
          fetch('/api/backend/api/v1/applications/my'),
          fetch('/api/backend/api/v1/leases'),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const p = await profileRes.value.json();
          setProfile(p);
        }

        if (appsRes.status === 'fulfilled' && appsRes.value.ok) {
          const a = await appsRes.value.json();
          setApplications(Array.isArray(a) ? a : a.data || []);
        }

        if (leasesRes.status === 'fulfilled' && leasesRes.value.ok) {
          const l = await leasesRes.value.json();
          setLeases(Array.isArray(l) ? l : l.data || []);
        }
      } catch (err) {
        console.error('Failed to load client data', err);
      } finally {
        setLoading(false);
      }
    }
    loadClientData();
  }, []);

  const verificationStatus = profile?.verificationStatus || 'UNVERIFIED';
  const isVerified = verificationStatus === 'VERIFIED';
  const documentsCount = profile?.documents?.length || 0;

  return (
    <div className="page-stack">
      {/* Welcome & KYC Status Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(22, 163, 74, 0.2)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(22, 163, 74, 0.3)',
            }}>
              CLIENT PORTAL
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Republic of Zimbabwe • State Land Lease System
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Welcome, {currentUser?.name || 'Applicant'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '640px' }}>
            Track your verified legal identity, ongoing land applications, waiting list rankings, and execute official statutory leases.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/parcels?status=AVAILABLE&view=map" className="btn btn-accent">
            🗺️ Browse Free Land on Map
          </Link>
          <Link href="/client/kyc" className="btn btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            {isVerified ? 'View KYC Profile' : 'Complete KYC Verification'}
          </Link>
          <Link href="/client/applications" className="btn btn-outline">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Apply for Land
          </Link>
        </div>
      </div>

      {/* KYC Alert if not verified */}
      {!isVerified && (
        <div className="glass-panel" style={{
          padding: '16px 20px',
          background: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <h4 style={{ color: 'var(--accent-400)', fontSize: '0.9375rem', marginBottom: '2px' }}>
                Identity Verification Required
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Under the Agricultural Land Settlement Act, all applicants must submit proof of identity and tax compliance before lease allocation.
              </p>
            </div>
          </div>
          <Link href="/client/kyc" className="btn btn-accent" style={{ fontSize: '0.8125rem', padding: '8px 14px' }}>
            Upload Documents
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="glass-panel stat-card" style={{ borderColor: isVerified ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)' }}>
          <div className="stat-label">KYC Verification</div>
          <div className="stat-value" style={{ color: isVerified ? 'var(--primary-400)' : 'var(--accent-400)', fontSize: '1.375rem' }}>
            {verificationStatus.replace('_', ' ')}
          </div>
          <div className="stat-trend">
            <span>{documentsCount} documents lodged with Registry</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Active Applications</div>
          <div className="stat-value">{applications.length}</div>
          <div className="stat-trend" style={{ color: 'var(--primary-400)' }}>
            <span>{applications.filter(a => a.waitingListNumber).length} on National Waiting List</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Leases & Offers</div>
          <div className="stat-value">{leases.length}</div>
          <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
            <span>{leases.filter(l => l.status === 'ACTIVE').length} Active • {leases.filter(l => l.status === 'PENDING_ACCEPTANCE').length} Pending Acceptance</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Primary Waiting List No.</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: 'var(--accent-300)' }}>
            {applications.find(a => a.waitingListNumber)?.waitingListNumber || 'None'}
          </div>
          <div className="stat-trend">
            <span>Priority allocation based on date & scoring</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(22, 163, 74, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)' }}>
              📄
            </div>
            <h3 style={{ fontSize: '1.125rem' }}>National Waiting List</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Monitor your waiting list queue position, submit new land requests, and verify parcel allocation progress.
          </p>
          <Link href="/client/applications" className="btn btn-outline" style={{ width: '100%' }}>
            View Land Applications ({applications.length})
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-400)' }}>
              📜
            </div>
            <h3 style={{ fontSize: '1.125rem' }}>Statutory Leases & Offers</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Review formal Lease Offers issued by the Ministry, sign lease covenants, and download official 99-year agreements.
          </p>
          <Link href="/client/leases" className="btn btn-outline" style={{ width: '100%' }}>
            View Leases & Offers ({leases.length})
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              🛡️
            </div>
            <h3 style={{ fontSize: '1.125rem' }}>KYC & Legal Documentation</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Keep your National ID, Corporate Registration, and ZIMRA Tax Clearance certificates verified and up to date.
          </p>
          <Link href="/client/kyc" className="btn btn-outline" style={{ width: '100%' }}>
            Manage KYC Documents ({documentsCount})
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(34, 197, 94, 0.4)', background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.12), rgba(15, 23, 42, 0.8))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(22, 163, 74, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)', fontSize: '1.25rem' }}>
              🗺️
            </div>
            <h3 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Free Land Cadastre Map</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Browse surveyed idle state land parcels across Zimbabwe. Select any green parcel on the GIS map to inspect soil type, water access, and apply for allocation.
          </p>
          <Link href="/parcels?status=AVAILABLE&view=map" className="btn btn-primary" style={{ width: '100%' }}>
            Select Parcel on Spatial Map →
          </Link>
        </div>
      </div>
    </div>
  );
}
