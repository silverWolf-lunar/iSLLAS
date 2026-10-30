'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  hectaresRequested?: number;
  capitalInvestmentUsd?: number;
  provinceId?: string;
  districtId?: string;
  parcel?: {
    id?: string;
    referenceNumber: string;
    name?: string;
    areaHectares: number;
    province?: string;
    district?: string;
  };
}

interface LeaseItem {
  id: string;
  leaseNumber: string;
  status: string;
  startDate: string;
  annualRentUsd: number;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'APPLICATION' | 'KYC' | 'LEASE' | 'GAZETTE';
  timestamp: string;
  read: boolean;
  priority?: 'high' | 'normal' | 'info';
  actionUrl?: string;
  actionLabel?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Application Advanced to Provincial Land Board',
    message: 'Your allocation request for Parcel PAR-2026-MSW-042 (120 ha in Makonde District) passed District Cadastre verification and is placed on the Provincial Land Board Docket.',
    type: 'APPLICATION',
    timestamp: 'Today, 08:30 AM',
    read: false,
    priority: 'high',
    actionUrl: '#tracker',
    actionLabel: 'Track Progress',
  },
  {
    id: 'notif-2',
    title: 'KYC Document Verification Approved',
    message: 'Your National ID Document and Agricultural Business Profile have been verified by the Makonde District Registry. Your profile is now Tier 1 Verified.',
    type: 'KYC',
    timestamp: 'Yesterday, 04:15 PM',
    read: false,
    priority: 'normal',
    actionUrl: '/client/kyc',
    actionLabel: 'View Profile',
  },
  {
    id: 'notif-3',
    title: '99-Year Lease Offer Issued',
    message: 'Formal Lease Offer for 85 hectares in Banket Commercial Zone is ready for your review and digital acceptance covenants.',
    type: 'LEASE',
    timestamp: '28 Oct 2026',
    read: true,
    priority: 'high',
    actionUrl: '/client/leases',
    actionLabel: 'Review Offer',
  },
  {
    id: 'notif-4',
    title: 'Statutory Ground Rent Schedule Gazetted',
    message: 'Ministry of Lands & Rural Development gazetted the 2026 ground rental schedule and conservation development rebates under Statutory Instrument 142/2026.',
    type: 'GAZETTE',
    timestamp: '24 Oct 2026',
    read: true,
    priority: 'info',
  },
];

export default function ClientDashboardPage() {
  const { currentUser } = useApp();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [leases, setLeases] = useState<LeaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Application Tracking State
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [searchTrackingNumber, setSearchTrackingNumber] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD' | 'APPLICATION' | 'STATUTORY'>('ALL');

  useEffect(() => {
    async function loadClientData() {
      try {
        setLoading(true);
        const [profileRes, appsRes, leasesRes, notifsRes] = await Promise.allSettled([
          fetch('/api/backend/api/v1/client-profiles/me'),
          fetch('/api/backend/api/v1/applications/my'),
          fetch('/api/backend/api/v1/leases'),
          fetch('/api/backend/api/v1/notifications'),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const p = await profileRes.value.json();
          setProfile(p);
        }

        if (appsRes.status === 'fulfilled' && appsRes.value.ok) {
          const a = await appsRes.value.json();
          const list = Array.isArray(a) ? a : a.data || [];
          setApplications(list);
          if (list.length > 0) {
            setSelectedAppId(list[0].id);
          }
        }

        if (leasesRes.status === 'fulfilled' && leasesRes.value.ok) {
          const l = await leasesRes.value.json();
          setLeases(Array.isArray(l) ? l : l.data || []);
        }

        if (notifsRes.status === 'fulfilled' && notifsRes.value.ok) {
          const n = await notifsRes.value.json();
          if (Array.isArray(n) && n.length > 0) {
            const formatted: NotificationItem[] = n.map((item: any, idx: number) => ({
              id: item.id || `notif-api-${idx}`,
              title: item.title || item.subject || 'Statutory Notice',
              message: item.body || item.message || 'Notification from Ministry of Lands.',
              type: item.type || 'APPLICATION',
              timestamp: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent',
              read: Boolean(item.readAt || item.read),
              actionUrl: item.actionUrl,
              actionLabel: item.actionLabel,
            }));
            setNotifications(formatted);
          }
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

  // Active tracked application (use first DB application or fallback to sample)
  const trackedApps: ApplicationItem[] = useMemo(() => {
    if (applications.length > 0) return applications;
    return [
      {
        id: 'sample-app-1',
        applicationNumber: 'APP-2026-MSW-042',
        waitingListNumber: 'WL-MSW-2026-0089',
        status: 'UNDER_REVIEW',
        createdAt: '2026-10-18T10:30:00Z',
        proposedLandUse: 'CROPPING & HORTICULTURE',
        hectaresRequested: 120,
        capitalInvestmentUsd: 25000,
        provinceId: 'Mashonaland West',
        districtId: 'Makonde',
        parcel: {
          id: 'p-042',
          referenceNumber: 'PAR-2026-MSW-042',
          name: 'Chinhoyi North Farm Block 4',
          areaHectares: 120,
          province: 'Mashonaland West',
          district: 'Makonde',
        },
      },
    ];
  }, [applications]);

  const activeApp = useMemo(() => {
    if (selectedAppId) {
      const found = trackedApps.find(a => a.id === selectedAppId);
      if (found) return found;
    }
    return trackedApps[0];
  }, [selectedAppId, trackedApps]);

  // Notifications filtering & handlers
  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (notifFilter === 'UNREAD') return !n.read;
      if (notifFilter === 'APPLICATION') return n.type === 'APPLICATION';
      if (notifFilter === 'STATUTORY') return n.type === 'LEASE' || n.type === 'GAZETTE';
      return true;
    });
  }, [notifications, notifFilter]);

  const toggleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Stepper Stage Calculation
  const getStageIndex = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'DRAFT':
        return 1;
      case 'UNDER_REVIEW':
      case 'INFO_REQUESTED':
        return 2;
      case 'SITE_INSPECTION':
        return 3;
      case 'APPROVED':
        return 4;
      case 'OFFER_ISSUED':
      case 'ACCEPTED':
      case 'ACTIVE':
        return 5;
      default:
        return 2;
    }
  };

  const currentStage = getStageIndex(activeApp?.status || 'UNDER_REVIEW');

  const STAGES = [
    {
      num: 1,
      title: 'Application Lodged',
      desc: 'Submitted Online via SLLAS Portal',
      station: 'District Registry Intake',
      sla: 'Day 1',
    },
    {
      num: 2,
      title: 'KYC & Legal Vetting',
      desc: 'National ID, Tax Clearance & Spousal Rights',
      station: 'District Lands Office (Makonde)',
      sla: 'Day 3–5',
    },
    {
      num: 3,
      title: 'Cadastre Spatial Review',
      desc: 'Boundary Inspection & No-Dispute Clearance',
      station: 'Surveyor-General Cadastre GIS',
      sla: 'Day 7–10',
    },
    {
      num: 4,
      title: 'Provincial Land Board',
      desc: 'Waiting List Scoring & Board Resolution',
      station: 'Mashonaland West Provincial Board',
      sla: 'Day 14',
    },
    {
      num: 5,
      title: 'Ministerial Lease Issuance',
      desc: 'Statutory 99-Year Lease Covenants & Signing',
      station: 'Ministerial Estates Directorate',
      sla: 'Final Step',
    },
  ];

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
              FARMER DASHBOARD
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Republic of Zimbabwe • Ministry of Lands &amp; Rural Development
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: 'var(--text-main)', margin: '0 0 6px' }}>
            Welcome, {currentUser?.name || 'Applicant'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '640px', margin: 0 }}>
            Track your verified legal identity, live application progress across statutory checkpoints, and manage notifications and leases.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/parcels?status=AVAILABLE&view=map" className="btn btn-accent">
            🗺️ Browse Free Land on Map
          </Link>
          <Link href="/client/kyc" className="btn btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {isVerified ? 'View KYC Profile' : 'Complete KYC Verification'}
          </Link>
          <Link href="/client/applications" className="btn btn-outline">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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
              <h4 style={{ color: 'var(--accent-400)', fontSize: '0.9375rem', marginBottom: '2px', fontWeight: 600 }}>
                Identity Verification Required
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
                Under the Agricultural Land Settlement Act, all applicants must submit proof of identity and tax compliance before lease allocation.
              </p>
            </div>
          </div>
          <Link href="/client/kyc" className="btn btn-accent" style={{ fontSize: '0.8125rem', padding: '8px 14px' }}>
            Upload Documents
          </Link>
        </div>
      )}

      {/* Top Stat Cards */}
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
          <div className="stat-label">Tracked Applications</div>
          <div className="stat-value">{trackedApps.length}</div>
          <div className="stat-trend" style={{ color: 'var(--primary-400)' }}>
            <span>{trackedApps.filter(a => a.waitingListNumber).length} on National Waiting List</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Unread Notifications</div>
          <div className="stat-value" style={{ color: unreadCount > 0 ? 'var(--accent-400)' : 'var(--text-main)' }}>
            {unreadCount}
          </div>
          <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
            <span>{notifications.length} total messages in inbox</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">Primary Waiting List No.</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: 'var(--accent-300)' }}>
            {trackedApps.find(a => a.waitingListNumber)?.waitingListNumber || 'Pending'}
          </div>
          <div className="stat-trend">
            <span>Priority allocation based on date &amp; points</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Application Tracking (Left 65%) + Notifications (Right 35%) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* ============================================================== */}
        {/* LEFT COLUMN: APPLICATION TRACKING COMPONENT                     */}
        {/* ============================================================== */}
        <section id="tracker" className="glass-panel" style={{
          padding: '24px',
          borderRadius: '16px',
          gridColumn: 'span 2',
        }}>
          {/* Tracker Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.25rem' }}>🧭</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Application Progress Tracker
                </h2>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}>
                  REAL-TIME STATUTORY PIPELINE
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                Live visibility into District KYC checks, Cadastral GIS surveys, and Provincial Land Board docket status.
              </p>
            </div>

            {/* Application Selector (if multiple) */}
            {trackedApps.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Select File:
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="select-field"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.8125rem',
                    borderRadius: '6px',
                  }}
                >
                  {trackedApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.applicationNumber} ({a.parcel?.referenceNumber || 'Unassigned'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Active Application Card & Metadata */}
          {activeApp && (
            <div>
              {/* Application Details Summary Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
                padding: '16px',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '24px',
              }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Application Reference
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {activeApp.applicationNumber}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Target Land Parcel
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-400)', marginTop: '2px' }}>
                    {activeApp.parcel?.referenceNumber || 'General Allocation'} • {activeApp.parcel?.areaHectares || activeApp.hectaresRequested || 50} ha
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Waiting List Queue
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-400)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {activeApp.waitingListNumber || 'Assigned Post-Review'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Current Milestone
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      boxShadow: '0 0 8px #38bdf8',
                    }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#38bdf8' }}>
                      {STAGES[currentStage - 1]?.title || 'In Review'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5-STAGE INTERACTIVE PROGRESS STEPPER */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                  position: 'relative',
                }}>
                  {STAGES.map((stage) => {
                    const isDone = stage.num < currentStage;
                    const isActive = stage.num === currentStage;
                    const isPending = stage.num > currentStage;

                    return (
                      <div
                        key={stage.num}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        {/* Step Circle */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            marginBottom: '8px',
                            transition: 'all 0.2s ease',
                            background: isDone
                              ? 'var(--primary-600)'
                              : isActive
                              ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                              : 'var(--bg-card)',
                            color: isDone || isActive ? '#ffffff' : 'var(--text-dim)',
                            border: isDone
                              ? '2px solid var(--primary-400)'
                              : isActive
                              ? '2px solid #38bdf8'
                              : '2px solid var(--border-subtle)',
                            boxShadow: isActive ? '0 0 16px rgba(56, 189, 248, 0.4)' : undefined,
                          }}
                        >
                          {isDone ? '✓' : stage.num}
                        </div>

                        {/* Title & Desc */}
                        <div style={{
                          fontSize: '0.8125rem',
                          fontWeight: isActive ? 700 : 600,
                          color: isActive ? 'var(--text-main)' : isDone ? 'var(--text-main)' : 'var(--text-dim)',
                          marginBottom: '2px',
                        }}>
                          {stage.title}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                          {stage.desc}
                        </div>

                        {/* SLA pill */}
                        <span style={{
                          marginTop: '6px',
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: isDone
                            ? 'rgba(34, 197, 94, 0.15)'
                            : isActive
                            ? 'rgba(56, 189, 248, 0.15)'
                            : 'rgba(100, 116, 139, 0.15)',
                          color: isDone ? 'var(--primary-400)' : isActive ? '#38bdf8' : 'var(--text-dim)',
                        }}>
                          {isDone ? 'Complete' : isActive ? 'In Progress' : stage.sla}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Checkpoint Timeline Cards */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                padding: '18px',
              }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 14px', color: 'var(--text-main)' }}>
                  Statutory Audit History &amp; Station Log
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', flexShrink: 0 }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Electronic Application Lodged into National Cadastre
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Lodged on {new Date(activeApp.createdAt).toLocaleDateString()} • Fee payment verified ($50 Statutory Lodgment Fee)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', flexShrink: 0 }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        District Registry Verification &amp; KYC Clearance
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Makonde District Registry verified applicant credentials, national ID, and farming capability plan.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', flexShrink: 0 }}>
                      ⚡
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#38bdf8' }}>
                        Provincial Land Board Evaluation (Docket Active)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Scheduled on the Mashonaland West Provincial Allocation Docket. Awaiting board resolution and ministerial recommendation.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons for Tracker */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}>
                  <Link href="/client/applications" className="btn btn-outline" style={{ fontSize: '0.8125rem', padding: '6px 12px' }}>
                    View Full Application File
                  </Link>
                  <Link href="/client/leases" className="btn btn-primary" style={{ fontSize: '0.8125rem', padding: '6px 12px' }}>
                    Check Lease Offers ({leases.length})
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: NOTIFICATIONS & STATUTORY INBOX                   */}
        {/* ============================================================== */}
        <section className="glass-panel" style={{
          padding: '24px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '680px',
        }}>
          {/* Notifications Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🔔</span>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                }}>
                  {unreadCount} New
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-400)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '14px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}>
            {(['ALL', 'UNREAD', 'APPLICATION', 'STATUTORY'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setNotifFilter(tab)}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: notifFilter === tab ? 'var(--primary-600)' : 'var(--bg-card)',
                  color: notifFilter === tab ? '#ffffff' : 'var(--text-dim)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab === 'ALL' ? 'All' : tab === 'UNREAD' ? `Unread (${unreadCount})` : tab === 'APPLICATION' ? 'Applications' : 'Statutory'}
              </button>
            ))}
          </div>

          {/* Notifications Scroll List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto',
            paddingRight: '4px',
            flex: 1,
          }}>
            {filteredNotifications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 12px',
                color: 'var(--text-dim)',
                fontSize: '0.8125rem',
              }}>
                <div>📭</div>
                <div style={{ marginTop: '8px' }}>No notifications found in this view.</div>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleRead(item.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: item.read ? 'var(--bg-card)' : 'rgba(30, 41, 59, 0.4)',
                    border: item.read ? '1px solid var(--border-subtle)' : '1px solid rgba(56, 189, 248, 0.35)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  {/* Unread indicator dot */}
                  {!item.read && (
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      boxShadow: '0 0 6px #38bdf8',
                    }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.9375rem' }}>
                      {item.type === 'APPLICATION' ? '🌾' : item.type === 'KYC' ? '🛡️' : item.type === 'LEASE' ? '📜' : '📢'}
                    </span>
                    <span style={{
                      fontSize: '0.8125rem',
                      fontWeight: item.read ? 600 : 700,
                      color: item.read ? 'var(--text-main)' : '#ffffff',
                    }}>
                      {item.title}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    margin: '0 0 8px',
                    lineHeight: 1.45,
                  }}>
                    {item.message}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.6875rem',
                    color: 'var(--text-dim)',
                  }}>
                    <span>{item.timestamp}</span>

                    {item.actionUrl && (
                      <Link
                        href={item.actionUrl}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: 'var(--primary-400)',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        {item.actionLabel || 'Details →'}
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '8px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(22, 163, 74, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)' }}>
              📄
            </div>
            <h3 style={{ fontSize: '1.125rem', margin: 0 }}>National Waiting List</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px', lineHeight: 1.5 }}>
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
            <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Statutory Leases &amp; Offers</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px', lineHeight: 1.5 }}>
            Review formal Lease Offers issued by the Ministry, sign lease covenants, and download official 99-year agreements.
          </p>
          <Link href="/client/leases" className="btn btn-outline" style={{ width: '100%' }}>
            View Leases &amp; Offers ({leases.length})
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              🛡️
            </div>
            <h3 style={{ fontSize: '1.125rem', margin: 0 }}>KYC &amp; Legal Documentation</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px', lineHeight: 1.5 }}>
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
            <h3 style={{ fontSize: '1.125rem', color: '#ffffff', margin: 0 }}>Free Land Cadastre Map</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px', lineHeight: 1.5 }}>
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
