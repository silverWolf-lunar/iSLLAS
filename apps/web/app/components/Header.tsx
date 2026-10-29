'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Role } from '@sllas/contracts';

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
  office: string;
}

export const DEV_USERS: CurrentUser[] = [
  { id: 'usr-officer-01', name: 'Officer T. Moyo', role: Role.REGISTRY_OFFICER, office: 'Harare Registry Office' },
  { id: 'usr-officer-02', name: 'Senior Officer C. Chidzero', role: Role.APPROVER, office: 'National Directorate' },
  { id: 'usr-officer-03', name: 'Officer F. Sibanda', role: Role.REGISTRY_OFFICER, office: 'Bulawayo & Midlands Office' },
  { id: 'usr-admin-01', name: 'Admin K. Musarurwa', role: Role.SYSTEM_ADMIN, office: 'Ministry Headquarters' },
  { id: 'usr-audit-01', name: 'Auditor R. Ndlovu', role: Role.AUDITOR, office: 'State Audit Office' },
];

export function Header({
  currentUser,
  onUserChange,
}: {
  currentUser: CurrentUser | null;
  onUserChange: (user: CurrentUser) => void;
}) {
  const pathname = usePathname();

  return (
    <header className="header-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.25rem',
            color: '#fff',
            boxShadow: '0 0 16px rgba(22, 163, 74, 0.4)'
          }}>
            S
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>SLLAS</span>
              <span style={{
                fontSize: '0.625rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(217, 119, 6, 0.25)',
                color: 'var(--accent-400)',
                fontWeight: 700,
                border: '1px solid rgba(217, 119, 6, 0.4)'
              }}>ZIMBABWE</span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Smart Land Lease & Allocation System</div>
          </div>
        </Link>

        <nav className="nav-links" style={{ marginLeft: '16px' }}>
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
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
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
            background: currentUser?.role === Role.APPROVER ? 'var(--accent-400)' : 'var(--primary-400)',
            boxShadow: '0 0 8px currentColor'
          }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              {process.env.NODE_ENV === 'production' ? 'Signed in' : 'Development identity'}
            </span>
            {process.env.NODE_ENV === 'production' ? (
              <span style={{ color: 'var(--text-main)', fontSize: '0.8125rem', fontWeight: 600 }}>
                {currentUser ? `${currentUser.name} (${currentUser.role})` : 'Loading profile'}
              </span>
            ) : (
              <select
                value={currentUser?.id ?? DEV_USERS[0].id}
                onChange={(event) => {
                  const selected = DEV_USERS.find((user) => user.id === event.target.value);
                  if (selected) onUserChange(selected);
                }}
                aria-label="Development identity"
              >
                {DEV_USERS.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div style={{
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          {currentUser?.office ?? ''}
        </div>
        {process.env.NODE_ENV === 'production' && (
          <button className="btn btn-outline" onClick={() => signOut({ callbackUrl: '/signin' })}>
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
