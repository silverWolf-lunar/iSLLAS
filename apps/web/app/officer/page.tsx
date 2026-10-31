'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';
import { ZimbabweFlag } from '../components/ZimbabweFlag';
import { Role, ParcelStatus } from '@sllas/contracts';

interface ReviewQueueItem {
  id: string;
  applicationNumber: string;
  applicantName: string;
  nationalId: string;
  province: string;
  district: string;
  landUse: string;
  hectares: number;
  status: 'SUBMITTED' | 'UNDER_INSPECTION' | 'ALLOCATED' | 'APPROVED' | 'REJECTED';
  lodgedDate: string;
  suitabilityScore: number;
}

interface LeaseRegisterItem {
  id: string;
  leaseNumber: string;
  lesseeName: string;
  parcelRef: string;
  province: string;
  hectares: number;
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
  annualRentUsd: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}

interface NotificationLogItem {
  id: string;
  recipient: string;
  channel: 'SMS' | 'EMAIL' | 'PUSH';
  subject: string;
  timestamp: string;
  status: 'SENT' | 'FAILED' | 'SUPPRESSED';
  failureReason?: string;
}

interface AuditLogItem {
  id: string;
  actor: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  hashSignature: string;
}

interface ManagedUserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  province: string;
  status: 'ACTIVE' | 'DEACTIVATED';
  lastLogin: string;
}

const INITIAL_REVIEW_QUEUE: ReviewQueueItem[] = [
  {
    id: 'app-01',
    applicationNumber: 'APP-2026-MSW-0042',
    applicantName: 'Farai Mutasa (Agri-Enterprises Ltd)',
    nationalId: '63-884129-K-42',
    province: 'Mashonaland West',
    district: 'Makonde',
    landUse: 'Commercial Cropping',
    hectares: 120,
    status: 'SUBMITTED',
    lodgedDate: '2026-10-28',
    suitabilityScore: 94,
  },
  {
    id: 'app-02',
    applicationNumber: 'APP-2026-MID-0118',
    applicantName: 'Chiedza Sibanda',
    nationalId: '08-223190-R-08',
    province: 'Midlands',
    district: 'Gweru',
    landUse: 'Livestock Ranching',
    hectares: 250,
    status: 'UNDER_INSPECTION',
    lodgedDate: '2026-10-25',
    suitabilityScore: 89,
  },
  {
    id: 'app-03',
    applicationNumber: 'APP-2026-MAN-0089',
    applicantName: 'Nyasha Zhou',
    nationalId: '15-992341-T-15',
    province: 'Manicaland',
    district: 'Mutasa',
    landUse: 'Horticulture & Macadamia',
    hectares: 65,
    status: 'ALLOCATED',
    lodgedDate: '2026-10-22',
    suitabilityScore: 96,
  },
  {
    id: 'app-04',
    applicationNumber: 'APP-2026-MSE-0145',
    applicantName: 'Blessing Ndlovu',
    nationalId: '29-109384-M-29',
    province: 'Mashonaland East',
    district: 'Goromonzi',
    landUse: 'Poultry & Mixed Farming',
    hectares: 35,
    status: 'SUBMITTED',
    lodgedDate: '2026-10-29',
    suitabilityScore: 82,
  },
];

const INITIAL_LEASES: LeaseRegisterItem[] = [
  {
    id: 'ls-01',
    leaseNumber: 'ZW-LS-2026-MSW-0012',
    lesseeName: 'Simba Mhlanga',
    parcelRef: 'ZW-MSW-MAK-2026-0012',
    province: 'Mashonaland West',
    hectares: 150,
    startDate: '2021-04-01',
    expiryDate: '2026-11-20',
    daysRemaining: 20,
    annualRentUsd: 1800,
    status: 'EXPIRING_SOON',
  },
  {
    id: 'ls-02',
    leaseNumber: 'ZW-LS-2025-MID-0084',
    lesseeName: 'Kudzai Moyo',
    parcelRef: 'ZW-MID-KWE-2025-0084',
    province: 'Midlands',
    hectares: 320,
    startDate: '2020-09-15',
    expiryDate: '2026-12-05',
    daysRemaining: 35,
    annualRentUsd: 3200,
    status: 'EXPIRING_SOON',
  },
  {
    id: 'ls-03',
    leaseNumber: 'ZW-LS-2024-MAN-0056',
    lesseeName: 'Tariro Sithole',
    parcelRef: 'ZW-MAN-MUT-2024-0056',
    province: 'Manicaland',
    hectares: 85,
    startDate: '2024-01-10',
    expiryDate: '2123-01-10',
    daysRemaining: 35140,
    annualRentUsd: 1020,
    status: 'ACTIVE',
  },
  {
    id: 'ls-04',
    leaseNumber: 'ZW-LS-2016-MSW-0003',
    lesseeName: 'T. Vhurumuku',
    parcelRef: 'ZW-MSW-ZVI-2016-0003',
    province: 'Mashonaland West',
    hectares: 200,
    startDate: '2016-06-01',
    expiryDate: '2026-06-01',
    daysRemaining: -152,
    annualRentUsd: 2400,
    status: 'EXPIRED',
  },
];

const INITIAL_NOTIFICATIONS: NotificationLogItem[] = [
  {
    id: 'notif-log-1',
    recipient: '+263 77 234 5678 (Farai Mutasa)',
    channel: 'SMS',
    subject: 'Application APP-2026-MSW-0042 placed on Provincial Board Docket',
    timestamp: '2026-10-31 09:15',
    status: 'SENT',
  },
  {
    id: 'notif-log-2',
    recipient: 'smhlanga@farms.co.zw',
    channel: 'EMAIL',
    subject: 'Statutory 30-Day Lease Expiry & Renewal Notice (ZW-LS-2026-MSW-0012)',
    timestamp: '2026-10-31 08:30',
    status: 'SENT',
  },
  {
    id: 'notif-log-3',
    recipient: '+263 71 889 0012 (K. Moyo)',
    channel: 'SMS',
    subject: 'Ground Rent Payment Schedule SI 142/2026 Dispatch',
    timestamp: '2026-10-30 16:45',
    status: 'FAILED',
    failureReason: 'Mobile network gateway timeout (Econet SMS-C 504)',
  },
  {
    id: 'notif-log-4',
    recipient: 'compliance-alerts@sllas.gov.zw',
    channel: 'PUSH',
    subject: 'Jurisdiction boundary query suppression (Duplicate dispatch prevent)',
    timestamp: '2026-10-30 14:10',
    status: 'SUPPRESSED',
    failureReason: 'Statutory deduplication filter active (1 msg/24h)',
  },
];

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-01',
    actor: 'officer@sllas.gov.zw',
    role: 'REGISTRY_OFFICER',
    action: 'PARCEL_REGISTRATION',
    entityType: 'PARCEL',
    entityId: 'ZW-MSW-MAK-2026-0042',
    timestamp: '2026-10-31 09:42:15',
    hashSignature: 'SHA256:4a8b2...f9e1',
  },
  {
    id: 'aud-02',
    actor: 'approver@sllas.gov.zw',
    role: 'APPROVER',
    action: 'LEASE_ALLOCATION_APPROVED',
    entityType: 'APPLICATION',
    entityId: 'APP-2026-MAN-0089',
    timestamp: '2026-10-30 15:20:00',
    hashSignature: 'SHA256:bc319...017a',
  },
  {
    id: 'aud-03',
    actor: 'admin@sllas.gov.zw',
    role: 'SYSTEM_ADMIN',
    action: 'USER_ROLE_ASSIGNMENT',
    entityType: 'USER',
    entityId: 'usr-officer-goromonzi',
    timestamp: '2026-10-30 11:05:42',
    hashSignature: 'SHA256:d89e4...a62c',
  },
];

const INITIAL_USERS: ManagedUserItem[] = [
  {
    id: 'usr-1',
    name: 'Tinashe Mariga',
    email: 'officer@sllas.gov.zw',
    role: Role.REGISTRY_OFFICER,
    province: 'Mashonaland West',
    status: 'ACTIVE',
    lastLogin: '2026-10-31 08:45',
  },
  {
    id: 'usr-2',
    name: 'Hon. Justice M. Chidyausiku',
    email: 'approver@sllas.gov.zw',
    role: Role.APPROVER,
    province: 'National Board',
    status: 'ACTIVE',
    lastLogin: '2026-10-30 16:12',
  },
  {
    id: 'usr-3',
    name: 'Ruvimbo Gonese',
    email: 'estates@sllas.gov.zw',
    role: Role.ESTATES_OFFICER,
    province: 'Harare Head Office',
    status: 'ACTIVE',
    lastLogin: '2026-10-31 07:30',
  },
  {
    id: 'usr-4',
    name: 'Munyaradzi Biti',
    email: 'admin@sllas.gov.zw',
    role: Role.SYSTEM_ADMIN,
    province: 'National Cadastre',
    status: 'ACTIVE',
    lastLogin: '2026-10-31 09:50',
  },
  {
    id: 'usr-5',
    name: 'Sekai Makore',
    email: 'auditor@sllas.gov.zw',
    role: Role.AUDITOR,
    province: 'Auditor General Office',
    status: 'ACTIVE',
    lastLogin: '2026-10-29 14:20',
  },
];

type DashboardTab = 'queue' | 'inventory' | 'leases' | 'notifications' | 'reports' | 'audit' | 'users';

export default function OfficerDashboardPage() {
  const { currentUser, parcels, provinces } = useApp();

  // Active Dashboard Panel Tab
  const [activeTab, setActiveTab] = useState<DashboardTab>('queue');

  // Review Queue Filter State
  const [queueProvinceFilter, setQueueProvinceFilter] = useState<string>('ALL');
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('ALL');
  const [queueSearch, setQueueSearch] = useState<string>('');

  // Land Inventory Filter & Sort State
  const [invSearch, setInvSearch] = useState<string>('');
  const [invProvince, setInvProvince] = useState<string>('ALL');
  const [invStatus, setInvStatus] = useState<string>('ALL');
  const [invLandUse, setInvLandUse] = useState<string>('ALL');
  const [invSortBy, setInvSortBy] = useState<'reference' | 'size' | 'status'>('reference');

  // Lease Register Filter State
  const [leaseStatusFilter, setLeaseStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');

  // Notification Filter State
  const [notifStatusFilter, setNotifStatusFilter] = useState<'ALL' | 'SENT' | 'FAILED' | 'SUPPRESSED'>('ALL');

  // User Management State
  const [usersList, setUsersList] = useState<ManagedUserItem[]>(INITIAL_USERS);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>(Role.REGISTRY_OFFICER);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  // Dynamic Metrics (Section 4.3.1 Specification: 7 KPI Cards)
  const registeredParcelsCount = parcels.length;
  const availableParcelsCount = parcels.filter(p => p.status === 'AVAILABLE').length;
  const applicationsReceivedCount = INITIAL_REVIEW_QUEUE.length + 12;
  const applicationsPendingReviewCount = INITIAL_REVIEW_QUEUE.filter(q => q.status === 'SUBMITTED' || q.status === 'UNDER_INSPECTION').length;
  const activeLeasesCount = INITIAL_LEASES.filter(l => l.status === 'ACTIVE').length + 840;
  const leasesExpiringSoonCount = INITIAL_LEASES.filter(l => l.status === 'EXPIRING_SOON').length;
  const notificationsSentCount = INITIAL_NOTIFICATIONS.filter(n => n.status === 'SENT').length + 3120;

  // Filtered Review Queue
  const filteredQueue = useMemo(() => {
    return INITIAL_REVIEW_QUEUE.filter(item => {
      const matchProv = queueProvinceFilter === 'ALL' || item.province === queueProvinceFilter;
      const matchStatus = queueStatusFilter === 'ALL' || item.status === queueStatusFilter;
      const matchText = queueSearch === '' ||
        item.applicationNumber.toLowerCase().includes(queueSearch.toLowerCase()) ||
        item.applicantName.toLowerCase().includes(queueSearch.toLowerCase()) ||
        item.nationalId.toLowerCase().includes(queueSearch.toLowerCase());
      return matchProv && matchStatus && matchText;
    });
  }, [queueProvinceFilter, queueStatusFilter, queueSearch]);

  // Filtered Land Inventory
  const filteredInventory = useMemo(() => {
    let result = parcels.filter(p => {
      const matchText = invSearch === '' ||
        p.referenceNumber.toLowerCase().includes(invSearch.toLowerCase()) ||
        p.name.toLowerCase().includes(invSearch.toLowerCase()) ||
        p.district.toLowerCase().includes(invSearch.toLowerCase());
      const matchProv = invProvince === 'ALL' || p.province === invProvince;
      const matchStatus = invStatus === 'ALL' || p.status === invStatus;
      const matchUse = invLandUse === 'ALL' || p.landCategory === invLandUse;
      return matchText && matchProv && matchStatus && matchUse;
    });

    if (invSortBy === 'reference') {
      result.sort((a, b) => a.referenceNumber.localeCompare(b.referenceNumber));
    } else if (invSortBy === 'size') {
      result.sort((a, b) => (b.areaHectares || 0) - (a.areaHectares || 0));
    } else if (invSortBy === 'status') {
      result.sort((a, b) => a.status.localeCompare(b.status));
    }
    return result;
  }, [parcels, invSearch, invProvince, invStatus, invLandUse, invSortBy]);

  // Filtered Leases
  const filteredLeases = useMemo(() => {
    return INITIAL_LEASES.filter(l => {
      if (leaseStatusFilter === 'ALL') return true;
      return l.status === leaseStatusFilter;
    });
  }, [leaseStatusFilter]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return INITIAL_NOTIFICATIONS.filter(n => {
      if (notifStatusFilter === 'ALL') return true;
      return n.status === notifStatusFilter;
    });
  }, [notifStatusFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      if (userRoleFilter === 'ALL') return true;
      return u.role === userRoleFilter;
    });
  }, [usersList, userRoleFilter]);

  // User Actions
  const handleToggleUserStatus = (userId: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE' };
      }
      return u;
    }));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const created: ManagedUserItem = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      province: 'Harare Head Office',
      status: 'ACTIVE',
      lastLogin: 'Never',
    };
    setUsersList(prev => [created, ...prev]);
    setNewUserName('');
    setNewUserEmail('');
    setShowCreateUserModal(false);
  };

  // CSV Export for Reporting
  const handleExportCSV = () => {
    const headers = ['Province', 'TotalParcels', 'AvailableParcels', 'ActiveLeases', 'ExpiringLeases', 'PendingApplications'];
    const rows = [
      ['Mashonaland West', '420', '85', '310', '12', '45'],
      ['Mashonaland Central', '310', '64', '230', '8', '32'],
      ['Mashonaland East', '380', '72', '290', '15', '38'],
      ['Manicaland', '290', '58', '215', '9', '28'],
      ['Midlands', '460', '110', '330', '18', '52'],
      ['Masvingo', '340', '75', '245', '11', '36'],
      ['Matabeleland North', '280', '95', '170', '6', '24'],
      ['Matabeleland South', '310', '102', '190', '7', '26'],
      ['Harare Metropolitan', '120', '14', '95', '4', '18'],
      ['Bulawayo Metropolitan', '85', '10', '68', '3', '12'],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sllas-executive-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              background: 'rgba(22, 163, 74, 0.2)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(22, 163, 74, 0.3)',
            }}>
              SECTION 4.3.1 CONSOLIDATED DASHBOARD
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <ZimbabweFlag width={16} height={10} />
              <span>Administrator &amp; Resettlement Officer Operations Console</span>
            </div>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: 'var(--text-main)', margin: '0 0 6px' }}>
            Integrated Land Administration Workbench
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '780px', margin: 0 }}>
            Unified operational command: monitor cadastre KPIs, process live lease applications, manage land inventory, inspect lease registers, and audit compliance.
          </p>
        </div>

        {/* Shortcut Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/parcels/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>➕</span> Register Land Parcel
          </Link>
          <Link href="/officer/allocate" className="btn btn-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>⚖️</span> Allocation Workbench
          </Link>
          <Link href="/reports" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>📊</span> Full Reports Suite
          </Link>
        </div>
      </div>

      {/* 4.3.1 SPECIFICATION: 7 MANDATORY KPI CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
      }}>
        {/* 1. Registered Parcels */}
        <div className="glass-panel stat-card" style={{ padding: '16px' }}>
          <div className="stat-label">Registered Parcels</div>
          <div className="stat-value" style={{ fontSize: '1.75rem', color: '#ffffff' }}>{registeredParcelsCount}</div>
          <div className="stat-trend" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cadastre surveyed</div>
        </div>

        {/* 2. Available Parcels */}
        <div className="glass-panel stat-card" style={{ padding: '16px', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
          <div className="stat-label">Available Parcels</div>
          <div className="stat-value" style={{ fontSize: '1.75rem', color: 'var(--primary-400)' }}>{availableParcelsCount}</div>
          <div className="stat-trend" style={{ fontSize: '0.75rem', color: 'var(--primary-400)' }}>Ready for lease</div>
        </div>

        {/* 3. Applications Received */}
        <div className="glass-panel stat-card" style={{ padding: '16px', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
          <div className="stat-label">Applications Received</div>
          <div className="stat-value" style={{ fontSize: '1.75rem', color: '#60a5fa' }}>{applicationsReceivedCount}</div>
          <div className="stat-trend" style={{ fontSize: '0.75rem', color: '#60a5fa' }}>Total citizen filings</div>
        </div>

        {/* 4. Applications Pending Review */}
        <div className="glass-panel stat-card" style={{ padding: '16px', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <div className="stat-label">Pending Review</div>
          <div className="stat-value" style={{ fontSize: '1.75rem', color: 'var(--accent-400)' }}>{applicationsPendingReviewCount}</div>
          <div className="stat-trend" style={{ fontSize: '0.75rem', color: 'var(--accent-400)' }}>Awaiting action</div>
        </div>

        {/* 5. Active Leases */}
        <div className="glass-panel stat-card" style={{ padding: '16px', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
          <div className="stat-label">Active Leases</div>
          <div className="stat-value" style={{ fontSize: '1.75rem', color: '#c084fc' }}>{activeLeasesCount}</div>
          <div className="stat-trend" style={{ fontSize: '0.75rem', color: '#c084fc' }}>99-year legal tenure</div>
        </div>

        {/* 6. Leases Expiring Soon */}
        <div className="glass-panel stat-card" style={{ padding: '16px', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <div className="stat-label">Expiring Soon (&lt;90d)</div>
          <div className="stat-value" style={{ fontSize: '1.75rem', color: '#f87171' }}>{leasesExpiringSoonCount}</div>
          <div className="stat-trend" style={{ fontSize: '0.75rem', color: '#f87171' }}>Renewal notices due</div>
        </div>

        {/* 7. Notifications Sent */}
        <div className="glass-panel stat-card" style={{ padding: '16px' }}>
          <div className="stat-label">Notifications Sent</div>
          <div className="stat-value" style={{ fontSize: '1.75rem', color: '#38bdf8' }}>{notificationsSentCount.toLocaleString()}</div>
          <div className="stat-trend" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>SMS &amp; Email dispatches</div>
        </div>
      </div>

      {/* DASHBOARD CONSOLE NAVIGATION TABS */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '8px',
        overflowX: 'auto',
      }}>
        {[
          { key: 'queue', label: '1. Live Lease Review Queue', count: filteredQueue.length },
          { key: 'inventory', label: '2. Land Inventory Table', count: filteredInventory.length },
          { key: 'leases', label: '3. Lease Register', count: filteredLeases.length },
          { key: 'notifications', label: '4. Notification History', count: filteredNotifications.length },
          { key: 'reports', label: '5. Reporting & Analytics', badge: 'CSV' },
          { key: 'audit', label: '6. Audit Log Viewer', badge: 'Admin' },
          { key: 'users', label: '7. User Management', badge: 'Admin' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as DashboardTab)}
            style={{
              background: activeTab === tab.key ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
              border: activeTab === tab.key ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid transparent',
              color: activeTab === tab.key ? 'var(--primary-400)' : 'var(--text-muted)',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.6875rem',
              }}>
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span style={{
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.625rem',
                fontWeight: 700,
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: LIVE LEASE REVIEW QUEUE */}
      {activeTab === 'queue' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', color: '#ffffff', margin: 0 }}>Live Lease Review Queue</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '2px 0 0' }}>
                Applications awaiting resettlement action, technical assessment, and Land Board docket scheduling.
              </p>
            </div>

            {/* Queue Filters (Province, Status, Search) */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search applicant / app #..."
                className="glass-input"
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
                style={{ width: '200px', padding: '6px 10px', fontSize: '0.8125rem' }}
              />
              <select
                className="glass-input"
                value={queueProvinceFilter}
                onChange={e => setQueueProvinceFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
              >
                <option value="ALL">All Provinces</option>
                <option value="Mashonaland West">Mashonaland West</option>
                <option value="Midlands">Midlands</option>
                <option value="Manicaland">Manicaland</option>
                <option value="Mashonaland East">Mashonaland East</option>
              </select>
              <select
                className="glass-input"
                value={queueStatusFilter}
                onChange={e => setQueueStatusFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_INSPECTION">Under Inspection</option>
                <option value="ALLOCATED">Allocated</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>App Number</th>
                  <th style={{ padding: '10px' }}>Applicant</th>
                  <th style={{ padding: '10px' }}>Province &amp; District</th>
                  <th style={{ padding: '10px' }}>Land Use</th>
                  <th style={{ padding: '10px' }}>Hectares</th>
                  <th style={{ padding: '10px' }}>Fit Score</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontWeight: 600 }}>
                      {item.applicationNumber}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.applicantName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {item.nationalId}</div>
                    </td>
                    <td style={{ padding: '12px 10px' }}>{item.district}, {item.province}</td>
                    <td style={{ padding: '12px 10px' }}>{item.landUse}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 600 }}>{item.hectares} ha</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{
                        color: item.suitabilityScore >= 90 ? '#4ade80' : '#f59e0b',
                        fontWeight: 700,
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}>
                        {item.suitabilityScore}% Match
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className={`badge badge-${item.status.toLowerCase().replace('_', '-')}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <Link
                        href={`/officer/allocate?appId=${item.id}`}
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      >
                        Review &amp; Allocate →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LAND INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', color: '#ffffff', margin: 0 }}>National Land Inventory Table</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '2px 0 0' }}>
                Search, filter, and sort surveyed state farmland parcels by reference, province, district, land use, and availability.
              </p>
            </div>

            {/* Inventory Controls */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search reference, name, district..."
                className="glass-input"
                value={invSearch}
                onChange={e => setInvSearch(e.target.value)}
                style={{ width: '220px', padding: '6px 10px', fontSize: '0.8125rem' }}
              />
              <select
                className="glass-input"
                value={invProvince}
                onChange={e => setInvProvince(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
              >
                <option value="ALL">All Provinces</option>
                {provinces.map(p => (
                  <option key={p.code} value={p.name}>{p.name}</option>
                ))}
              </select>
              <select
                className="glass-input"
                value={invStatus}
                onChange={e => setInvStatus(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RESERVED">RESERVED</option>
                <option value="ALLOCATED">ALLOCATED</option>
                <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
              </select>
              <select
                className="glass-input"
                value={invSortBy}
                onChange={e => setInvSortBy(e.target.value as any)}
                style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
              >
                <option value="reference">Sort: Reference</option>
                <option value="size">Sort: Size (High → Low)</option>
                <option value="status">Sort: Status</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Parcel Reference</th>
                  <th style={{ padding: '10px' }}>Name / Designation</th>
                  <th style={{ padding: '10px' }}>Province &amp; District</th>
                  <th style={{ padding: '10px' }}>Category / Land Use</th>
                  <th style={{ padding: '10px' }}>Hectares</th>
                  <th style={{ padding: '10px' }}>Agro Region</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Cadastre</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.slice(0, 15).map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontWeight: 600 }}>
                      {p.referenceNumber}
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600, color: '#ffffff' }}>{p.name}</td>
                    <td style={{ padding: '10px' }}>{p.district}, {p.province}</td>
                    <td style={{ padding: '10px' }}>{p.landCategory}</td>
                    <td style={{ padding: '10px', fontWeight: 700 }}>{p.areaHectares} ha</td>
                    <td style={{ padding: '10px' }}>{p.naturalRegion || 'Region II'}</td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge badge-${p.status.toLowerCase().replace('_', '-')}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <Link href={`/parcels/${p.id}`} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LEASE REGISTER */}
      {activeTab === 'leases' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', color: '#ffffff', margin: 0 }}>Statutory Lease Register</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '2px 0 0' }}>
                Complete register of Active, Expiring Soon (&lt;90 days), and Expired 99-year agricultural leases.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setLeaseStatusFilter(st)}
                  className={`btn ${leaseStatusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Lease Number</th>
                  <th style={{ padding: '10px' }}>Registered Lessee</th>
                  <th style={{ padding: '10px' }}>Parcel Ref</th>
                  <th style={{ padding: '10px' }}>Province</th>
                  <th style={{ padding: '10px' }}>Area</th>
                  <th style={{ padding: '10px' }}>Expiry Date</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Deed Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeases.map(lease => (
                  <tr key={lease.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: '#c084fc', fontWeight: 600 }}>
                      {lease.leaseNumber}
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600, color: '#ffffff' }}>{lease.lesseeName}</td>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>{lease.parcelRef}</td>
                    <td style={{ padding: '10px' }}>{lease.province}</td>
                    <td style={{ padding: '10px' }}>{lease.hectares} ha</td>
                    <td style={{ padding: '10px' }}>
                      <div>{lease.expiryDate}</div>
                      <div style={{ fontSize: '0.6875rem', color: lease.daysRemaining < 90 ? '#f87171' : 'var(--text-muted)' }}>
                        {lease.daysRemaining > 0 ? `${lease.daysRemaining} days remaining` : 'Term elapsed'}
                      </div>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge badge-${lease.status.toLowerCase().replace('_', '-')}`}>
                        {lease.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <Link href={`/verify/lease/${lease.id}`} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                        📜 Verify Deed
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATION HISTORY PANEL */}
      {activeTab === 'notifications' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', color: '#ffffff', margin: 0 }}>Statutory Notification History</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '2px 0 0' }}>
                Complete audit trail of SMS, Email, and Push alerts dispatched across the republic.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {(['ALL', 'SENT', 'FAILED', 'SUPPRESSED'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setNotifStatusFilter(st)}
                  className={`btn ${notifStatusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredNotifications.map(notif => (
              <div
                key={notif.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${notif.status === 'SENT' ? 'rgba(34, 197, 94, 0.3)' : notif.status === 'FAILED' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: notif.channel === 'SMS' ? '#2563eb' : notif.channel === 'EMAIL' ? '#7c3aed' : '#059669',
                      color: '#ffffff',
                    }}>
                      {notif.channel}
                    </span>
                    <strong style={{ color: '#ffffff', fontSize: '0.875rem' }}>{notif.recipient}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notif.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>{notif.subject}</div>
                  {notif.failureReason && (
                    <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '2px' }}>
                      ⚠️ {notif.failureReason}
                    </div>
                  )}
                </div>

                <span className={`badge badge-${notif.status.toLowerCase()}`}>
                  {notif.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REPORTING PANEL WITH CSV EXPORT */}
      {activeTab === 'reports' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', color: '#ffffff', margin: 0 }}>Executive Reporting &amp; Provincial Summaries</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '2px 0 0' }}>
                Provincial land distribution breakdown, lease activity statistics, and official CSV export.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>📥</span> Export Statutory CSV Report
            </button>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Province</th>
                  <th style={{ padding: '10px' }}>Total Parcels</th>
                  <th style={{ padding: '10px' }}>Available (ha)</th>
                  <th style={{ padding: '10px' }}>Active Leases</th>
                  <th style={{ padding: '10px' }}>Expiring (&lt;90d)</th>
                  <th style={{ padding: '10px' }}>Pending Apps</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { prov: 'Mashonaland West', parcels: 420, availHa: '14,200', active: 310, expiring: 12, pending: 45 },
                  { prov: 'Midlands', parcels: 460, availHa: '22,400', active: 330, expiring: 18, pending: 52 },
                  { prov: 'Mashonaland East', parcels: 380, availHa: '11,800', active: 290, expiring: 15, pending: 38 },
                  { prov: 'Manicaland', parcels: 290, availHa: '8,900', active: 215, expiring: 9, pending: 28 },
                  { prov: 'Masvingo', parcels: 340, availHa: '19,500', active: 245, expiring: 11, pending: 36 },
                ].map(r => (
                  <tr key={r.prov} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px', fontWeight: 600, color: '#ffffff' }}>{r.prov}</td>
                    <td style={{ padding: '10px' }}>{r.parcels}</td>
                    <td style={{ padding: '10px', color: 'var(--primary-400)', fontWeight: 600 }}>{r.availHa} ha</td>
                    <td style={{ padding: '10px' }}>{r.active}</td>
                    <td style={{ padding: '10px', color: '#f87171' }}>{r.expiring}</td>
                    <td style={{ padding: '10px' }}>{r.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOG VIEWER */}
      {activeTab === 'audit' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', color: '#ffffff', margin: 0 }}>Statutory Audit Log Viewer</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '2px 0 0' }}>
                Immutable cryptographic ledger of administrative actions, parcel modifications, and approvals.
              </p>
            </div>
            <Link href="/audit" className="btn btn-outline" style={{ fontSize: '0.75rem' }}>
              Full Audit Ledger →
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Timestamp</th>
                  <th style={{ padding: '10px' }}>Actor</th>
                  <th style={{ padding: '10px' }}>Role</th>
                  <th style={{ padding: '10px' }}>Action</th>
                  <th style={{ padding: '10px' }}>Entity</th>
                  <th style={{ padding: '10px' }}>Cryptographic Hash</th>
                </tr>
              </thead>
              <tbody>
                {INITIAL_AUDIT_LOGS.map(aud => (
                  <tr key={aud.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{aud.timestamp}</td>
                    <td style={{ padding: '10px', fontWeight: 600, color: '#ffffff' }}>{aud.actor}</td>
                    <td style={{ padding: '10px' }}>
                      <span className="badge badge-primary">{aud.role}</span>
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{aud.action}</td>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>{aud.entityId}</td>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#a5b4fc' }}>
                      {aud.hashSignature}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', color: '#ffffff', margin: 0 }}>System User Management</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '2px 0 0' }}>
                Provision Ministry officers, assign administrative roles, deactivate accounts, and manage jurisdictional access.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className="glass-input"
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
              >
                <option value="ALL">All Roles</option>
                <option value={Role.REGISTRY_OFFICER}>Registry Officer</option>
                <option value={Role.APPROVER}>Land Board Approver</option>
                <option value={Role.ESTATES_OFFICER}>Estates Officer</option>
                <option value={Role.SYSTEM_ADMIN}>System Admin</option>
              </select>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowCreateUserModal(true)}
                style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
              >
                ➕ Create User
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Name &amp; Email</th>
                  <th style={{ padding: '10px' }}>Role</th>
                  <th style={{ padding: '10px' }}>Jurisdiction</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Last Sign In</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span className="badge badge-primary">{u.role}</span>
                    </td>
                    <td style={{ padding: '10px' }}>{u.province}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: u.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: u.status === 'ACTIVE' ? '#4ade80' : '#f87171',
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{u.lastLogin}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(u.id)}
                        className="btn btn-outline"
                        style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          color: u.status === 'ACTIVE' ? '#f87171' : '#4ade80',
                          borderColor: u.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
                        }}
                      >
                        {u.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Create User Modal */}
          {showCreateUserModal && (
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
              zIndex: 3000,
              padding: '20px',
            }}>
              <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
                <h3 style={{ fontSize: '1.125rem', color: '#ffffff', marginBottom: '16px' }}>
                  Create &amp; Assign Role to User
                </h3>
                <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Full Name</label>
                    <input
                      type="text"
                      className="glass-input"
                      required
                      placeholder="e.g. Tendai Mupfumira"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Email Address</label>
                    <input
                      type="email"
                      className="glass-input"
                      required
                      placeholder="e.g. tmupfumira@sllas.gov.zw"
                      value={newUserEmail}
                      onChange={e => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Administrative Role</label>
                    <select
                      className="glass-input"
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value as Role)}
                    >
                      <option value={Role.REGISTRY_OFFICER}>Registry Officer</option>
                      <option value={Role.APPROVER}>Land Board Approver</option>
                      <option value={Role.ESTATES_OFFICER}>Estates Officer</option>
                      <option value={Role.SYSTEM_ADMIN}>System Administrator</option>
                      <option value={Role.AUDITOR}>Compliance Auditor</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowCreateUserModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save &amp; Provision User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
