'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '@sllas/contracts';
import { CurrentUser } from './Header';
import { ROLE_CONFIG, NavItem } from '../lib/access';
import { Logo } from './Logo';
import { useTheme } from 'next-themes';

interface SidebarProps {
  currentUser: CurrentUser | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

// Crisp inline SVGs matching role navigation
function NavIcon({ href, collapsed }: { href: string; collapsed?: boolean }) {
  const iconProps = {
    width: collapsed ? 22 : 18,
    height: collapsed ? 22 : 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (href) {
    // Dashboards
    case '/client':
    case '/officer':
    case '/approver':
    case '/estates':
    case '/admin':
    case '/audit':
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );

    // Cadastre Map & Parcels
    case '/parcels':
      return (
        <svg {...iconProps}>
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      );

    // Register Parcel
    case '/parcels/new':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );

    // Verification Queue
    case '/parcels/verify':
      return (
        <svg {...iconProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );

    // Bulk Import
    case '/parcels/bulk-import':
      return (
        <svg {...iconProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      );

    // Applications & Review
    case '/client/applications':
    case '/officer/applicants':
      return (
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );

    // Leases
    case '/client/leases':
    case '/estates/leases':
      return (
        <svg {...iconProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );

    // KYC & Documents
    case '/client/kyc':
      return (
        <svg {...iconProps}>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <circle cx="8" cy="10" r="2" />
          <path d="M15 9h2" />
          <path d="M15 13h2" />
        </svg>
      );

    // Allocate Workbench
    case '/officer/allocate':
      return (
        <svg {...iconProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      );

    // Waiting List
    case '/estates/waiting-list':
      return (
        <svg {...iconProps}>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      );

    // User Management CRUD
    case '/admin/users':
      return (
        <svg {...iconProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    // Registry Offices
    case '/admin/offices':
      return (
        <svg {...iconProps}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M8 10h.01" />
          <path d="M16 10h.01" />
          <path d="M8 14h.01" />
          <path d="M16 14h.01" />
        </svg>
      );

    // Reports
    case '/reports':
      return (
        <svg {...iconProps}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );

    // Settings
    case '/settings':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );

    default:
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
}

export function Sidebar({
  currentUser,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  const role = currentUser?.role || Role.CLIENT;
  const roleConfig = ROLE_CONFIG[role];
  const navItems = roleConfig?.navItems || [];

  const getRoleColor = (r: Role) => {
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

  const roleColor = getRoleColor(role);

  // Group nav items into logical sections
  const coreItems = navItems.filter(item =>
    item.href === roleConfig?.defaultDashboard || item.href === '/parcels'
  );

  const operationItems = navItems.filter(item =>
    item.href !== roleConfig?.defaultDashboard &&
    item.href !== '/parcels' &&
    item.href !== '/settings' &&
    item.href !== '/reports'
  );

  const systemItems = navItems.filter(item =>
    item.href === '/reports' || item.href === '/settings'
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`app-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}
        aria-label="Sidebar navigation"
      >
        {/* Sidebar Header & National Crest */}
        <div className="sidebar-header">
          <Link
            href={roleConfig?.defaultDashboard || '/'}
            className="sidebar-brand-link"
            onClick={onCloseMobile}
          >
            {collapsed ? (
              <Logo variant="compact" theme={resolvedTheme === 'light' ? 'light' : 'dark'} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Logo variant="full" theme={resolvedTheme === 'light' ? 'light' : 'dark'} />
                <span className="sidebar-national-tag">
                  🇿🇼 REPUBLIC OF ZIMBABWE
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Role Badge Indicator */}
        {!collapsed && (
          <div className="sidebar-role-card" style={{ borderLeftColor: roleColor }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: roleColor,
                  boxShadow: `0 0 8px ${roleColor}`,
                }}
              />
              <span className="sidebar-role-title">
                {roleConfig?.displayName}
              </span>
            </div>
            <div className="sidebar-jurisdiction-tag">
              {currentUser?.office || 'National Cadastre Authority'}
            </div>
          </div>
        )}

        {/* Navigation Groups */}
        <div className="sidebar-scrollable-content">
          {/* Group 1: Core Workspace */}
          <div className="sidebar-group">
            {!collapsed && <div className="sidebar-group-title">WORKSPACE</div>}
            <nav className="sidebar-nav-list">
              {coreItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-nav-item ${isActive ? 'is-active' : ''}`}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sidebar-nav-icon" style={{ color: isActive ? roleColor : 'inherit' }}>
                      <NavIcon href={item.href} collapsed={collapsed} />
                    </span>
                    {!collapsed && (
                      <span className="sidebar-nav-label">
                        {item.label}
                      </span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="sidebar-nav-badge">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Group 2: Operational Modules */}
          {operationItems.length > 0 && (
            <div className="sidebar-group">
              {!collapsed && <div className="sidebar-group-title">OPERATIONS</div>}
              <nav className="sidebar-nav-list">
                {operationItems.map(item => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-nav-item ${isActive ? 'is-active' : ''}`}
                      onClick={onCloseMobile}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="sidebar-nav-icon" style={{ color: isActive ? roleColor : 'inherit' }}>
                        <NavIcon href={item.href} collapsed={collapsed} />
                      </span>
                      {!collapsed && (
                        <span className="sidebar-nav-label">
                          {item.label}
                        </span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="sidebar-nav-badge">{item.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Group 3: System, Reports & Governance */}
          <div className="sidebar-group">
            {!collapsed && <div className="sidebar-group-title">GOVERNANCE & SYSTEM</div>}
            <nav className="sidebar-nav-list">
              {systemItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-nav-item ${isActive ? 'is-active' : ''}`}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sidebar-nav-icon" style={{ color: isActive ? roleColor : 'inherit' }}>
                      <NavIcon href={item.href} collapsed={collapsed} />
                    </span>
                    {!collapsed && (
                      <span className="sidebar-nav-label">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Public Portal Link */}
              <Link
                href="/"
                className="sidebar-nav-item"
                onClick={onCloseMobile}
                title={collapsed ? 'Public Portal & Process Guide' : undefined}
              >
                <span className="sidebar-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </span>
                {!collapsed && (
                  <span className="sidebar-nav-label">
                    Public Portal & Guide
                  </span>
                )}
                {!collapsed && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
                    ↗
                  </span>
                )}
              </Link>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer & Collapse Toggle */}
        <div className="sidebar-footer">
          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand side navigation' : 'Collapse side navigation'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            >
              <polyline points="11 19 4 12 11 5" />
              <polyline points="18 19 11 12 18 5" />
            </svg>
            {!collapsed && <span>Collapse Sidebar</span>}
          </button>

          {/* User Mini-Profile */}
          <div className="sidebar-user-section">
            <div className="sidebar-avatar" style={{ background: roleColor }}>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar-user-meta">
                <div className="sidebar-user-name">
                  {currentUser ? currentUser.name : 'Loading…'}
                </div>
                <div className="sidebar-user-role">
                  {roleConfig?.displayName}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
