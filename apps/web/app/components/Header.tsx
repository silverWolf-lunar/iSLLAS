'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Role } from '@sllas/contracts';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ROLE_CONFIG, getDefaultDashboardForRole } from '../lib/access';
import { useApp } from './AppContext';

import { ZimbabweFlag } from './ZimbabweFlag';

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
  office: string;
  provinceId?: string | null;
  districtId?: string | null;
}

export function Header({
  currentUser,
  onOpenMobileSidebar,
}: {
  currentUser: CurrentUser | null;
  onOpenMobileSidebar?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [switchingRole, setSwitchingRole] = useState(false);
  const { switchDevRole } = useApp();
  const { data: session } = useSession();

  const sessionUser = session?.user as any;
  const role: Role =
    currentUser?.role ||
    (sessionUser?.role as Role) ||
    (pathname.startsWith('/admin')
      ? Role.SYSTEM_ADMIN
      : pathname.startsWith('/officer')
      ? Role.REGISTRY_OFFICER
      : pathname.startsWith('/estates')
      ? Role.ESTATES_OFFICER
      : pathname.startsWith('/approver')
      ? Role.APPROVER
      : Role.CLIENT);
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG[Role.CLIENT];

  const handleRoleChange = async (newRole: Role) => {
    if (newRole === currentUser?.role || switchingRole) return;
    setSwitchingRole(true);
    await switchDevRole(newRole);
    setSwitchingRole(false);
    router.push(getDefaultDashboardForRole(newRole));
  };

  const getRoleBadgeColor = (r?: Role) => {
    switch (r) {
      case Role.CLIENT: return '#22c55e';
      case Role.REGISTRY_OFFICER: return '#3b82f6';
      case Role.APPROVER: return '#f59e0b';
      case Role.ESTATES_OFFICER: return '#8b5cf6';
      case Role.SYSTEM_ADMIN: return '#ef4444';
      case Role.AUDITOR: return '#06b6d4';
      default: return '#22c55e';
    }
  };

  // Determine current section breadcrumb label
  const getBreadcrumbLabel = () => {
    if (pathname === '/client') return 'Farmer Overview';
    if (pathname === '/client/applications') return 'Applications & Waiting List';
    if (pathname === '/client/leases') return 'Offers & 99-Year Leases';
    if (pathname === '/client/kyc') return 'KYC & ID Documents';
    if (pathname === '/officer') return 'Registry Dashboard';
    if (pathname === '/officer/applicants') return 'Applicant Review Queue';
    if (pathname === '/officer/allocate') return 'Allocation Workbench';
    if (pathname === '/parcels') return 'Cadastre Parcel Explorer';
    if (pathname === '/parcels/new') return 'Register New Land Parcel';
    if (pathname === '/parcels/verify') return 'Verification Workbench';
    if (pathname === '/parcels/bulk-import') return 'Bulk Cadastre Import';
    if (pathname === '/approver') return 'Board Approvals Queue';
    if (pathname === '/estates') return 'Estates Directorate Console';
    if (pathname === '/estates/waiting-list') return 'Master Waiting List';
    if (pathname === '/estates/leases') return '99-Year Lease Generator';
    if (pathname === '/admin') return 'Executive Admin Console';
    if (pathname === '/admin/users') return 'User & Staff Management';
    if (pathname === '/admin/offices') return 'Registry Offices Directory';
    if (pathname === '/audit') return 'Statutory Compliance Audit Log';
    if (pathname === '/reports') return 'Executive Reports & Analytics';
    if (pathname === '/settings') return 'Platform Settings';
    return 'Console';
  };

  return (
    <header className="header-nav">
      {/* Left Area: Mobile Menu Trigger & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          className="sidebar-mobile-hamburger"
          onClick={onOpenMobileSidebar}
          aria-label="Open side navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Breadcrumb Trail */}
        <div className="header-breadcrumbs">
          <Link href={roleConfig?.defaultDashboard || '/'} className="breadcrumb-root">
            {roleConfig?.displayName}
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-active">{getBreadcrumbLabel()}</span>
        </div>
      </div>

      {/* Right Area: National Tag, Dev Role Switcher, Theme, User Profile */}
      <div className="header-account">
        {/* Government Badge (Hidden on very narrow screens) */}
        <div className="header-govt-badge">
          <ZimbabweFlag width={18} height={12} />
          <span>Ministry of Lands</span>
        </div>

        {/* Development Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Portal:
          </span>
          <select
            value={role}
            disabled={switchingRole}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            className="header-role-select"
          >
            <option value={Role.SYSTEM_ADMIN}>System Admin</option>
            <option value={Role.REGISTRY_OFFICER}>Resettlement Officer</option>
            <option value={Role.ESTATES_OFFICER}>Estates Officer</option>
            <option value={Role.APPROVER}>Land Board Approver</option>
            <option value={Role.AUDITOR}>Compliance Auditor</option>
            <option value={Role.CLIENT}>Citizen / Farmer</option>
          </select>
        </div>

        <ThemeSwitcher />

        {/* User Badge */}
        <div className="header-user-badge">
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: getRoleBadgeColor(role),
            boxShadow: `0 0 6px ${getRoleBadgeColor(role)}`,
          }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              {roleConfig ? roleConfig.displayName : 'Authorised Staff'}
            </span>
            <span style={{ color: 'var(--text-main)', fontSize: '0.8125rem', fontWeight: 600 }}>
              {currentUser
                ? currentUser.name
                : sessionUser?.name || sessionUser?.email || 'Authorised SLLAS Official'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline header-signout"
          onClick={() => signOut({ callbackUrl: '/signin' })}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
