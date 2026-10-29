'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Role } from '@sllas/contracts';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useTheme } from 'next-themes';

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
  office: string;
}

export function Header({
  currentUser,
}: {
  currentUser: CurrentUser | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const logoTheme = resolvedTheme === 'light' ? 'light' : 'dark';

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="header-nav">
      <div className="header-brand">
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <span className="header-logo-full"><Logo variant="full" theme={logoTheme} /></span>
          <span className="header-logo-compact"><Logo variant="compact" theme={logoTheme} /></span>
        </Link>

        <button className="nav-menu-button" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            Executive Overview
          </Link>
          <Link href="/parcels" className={`nav-link ${pathname === '/parcels' ? 'active' : ''}`}>
            Parcel Explorer
          </Link>
          <Link href="/parcels/new" className={`nav-link ${pathname === '/parcels/new' ? 'active' : ''}`}>
            + Register Parcel
          </Link>
          <Link href="/parcels/verify" className={`nav-link ${pathname === '/parcels/verify' ? 'active' : ''}`}>
            Verification Workbench
          </Link>
          <Link href="/parcels/bulk-import" className={`nav-link ${pathname === '/parcels/bulk-import' ? 'active' : ''}`}>
            Bulk Import
          </Link>
          <Link href="/settings" className={`nav-link mobile-settings-link ${pathname === '/settings' ? 'active' : ''}`}>
            Settings
          </Link>
        </nav>
      </div>

      <div className="header-account">
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
            background: currentUser?.role === Role.APPROVER ? 'var(--accent-yellow)' : 'var(--brand-green)',
              border: '1px solid var(--border-strong)'
          }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Signed in
            </span>
            <span style={{ color: 'var(--text-main)', fontSize: '0.8125rem', fontWeight: 600 }}>
              {currentUser ? `${currentUser.name} (${currentUser.role})` : 'Loading profile'}
            </span>
          </div>
        </div>

        <div style={{
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          {currentUser?.office ?? ''}
        </div>
        <button className="btn btn-outline header-signout" onClick={() => signOut({ callbackUrl: '/signin' })}>
          Sign out
        </button>
      </div>
    </header>
  );
}
