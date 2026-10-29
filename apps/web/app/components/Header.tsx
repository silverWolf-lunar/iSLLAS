'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Role } from '@sllas/contracts';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useTheme } from 'next-themes';
import { ROLE_CONFIG, getDefaultDashboardForRole } from '../lib/access';
import { useApp } from './AppContext';

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
}: {
  currentUser: CurrentUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const { resolvedTheme } = useTheme();
  const { switchDevRole } = useApp();
  const logoTheme = resolvedTheme === 'light' ? 'light' : 'dark';

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navItems = currentUser?.role ? (ROLE_CONFIG[currentUser.role]?.navItems || []) : [];
  const homeHref = currentUser ? getDefaultDashboardForRole(currentUser.role) : '/';
  const roleConfig = currentUser?.role ? ROLE_CONFIG[currentUser.role] : null;

  const handleRoleChange = async (newRole: Role) => {
    if (newRole === currentUser?.role || switchingRole) return;
    setSwitchingRole(true);
    await switchDevRole(newRole);
    setSwitchingRole(false);
    router.push(getDefaultDashboardForRole(newRole));
  };

  const getRoleBadgeColor = (role?: Role) => {
    switch (role) {
      case Role.CLIENT: return '#3b82f6';
      case Role.REGISTRY_OFFICER: return '#10b981';
      case Role.APPROVER: return '#f59e0b';
      case Role.ESTATES_OFFICER: return '#8b5cf6';
      case Role.SYSTEM_ADMIN: return '#ef4444';
      case Role.AUDITOR: return '#06b6d4';
      default: return '#10b981';
    }
  };

  return (
    <header className="header-nav">
      <div className="header-brand">
        <Link href={homeHref} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <span className="header-logo-full"><Logo variant="full" theme={logoTheme} /></span>
          <span className="header-logo-compact"><Logo variant="compact" theme={logoTheme} /></span>
        </Link>

        <button className="nav-menu-button" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="header-account">
        {/* Development Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Portal:
          </span>
          <select
            value={currentUser?.role || Role.CLIENT}
            disabled={switchingRole}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            style={{
              background: 'var(--surface-elevated)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-card)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value={Role.CLIENT}>Farmer / Client</option>
            <option value={Role.REGISTRY_OFFICER}>Registry Officer</option>
            <option value={Role.APPROVER}>Board Approver</option>
            <option value={Role.ESTATES_OFFICER}>Estates Officer</option>
            <option value={Role.SYSTEM_ADMIN}>System Admin</option>
            <option value={Role.AUDITOR}>Auditor</option>
          </select>
        </div>

        <ThemeSwitcher />

        <div style={{
          background: 'var(--surface-elevated)',
          padding: '4px 10px',
          borderRadius: '8px',
          border: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: getRoleBadgeColor(currentUser?.role),
            border: '1px solid var(--border-strong)'
          }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              {roleConfig ? roleConfig.displayName : 'Signed in'}
            </span>
            <span style={{ color: 'var(--text-main)', fontSize: '0.8125rem', fontWeight: 600 }}>
              {currentUser ? currentUser.name : 'Loading profile'}
            </span>
          </div>
        </div>

        {currentUser?.office && (
          <div style={{
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            {currentUser.office}
          </div>
        )}

        <button className="btn btn-outline header-signout" onClick={() => signOut({ callbackUrl: '/signin' })}>
          Sign out
        </button>
      </div>
    </header>
  );
}
