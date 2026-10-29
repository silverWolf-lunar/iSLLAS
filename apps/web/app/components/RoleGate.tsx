'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useApp } from './AppContext';
import { canAccessRoute, getDefaultDashboardForRole, ROLE_CONFIG } from '../lib/access';

export function RoleGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, profileLoading } = useApp();
  const [deniedPath, setDeniedPath] = useState<string | null>(null);

  useEffect(() => {
    const denied = searchParams.get('denied');
    const from = searchParams.get('from');
    if (denied && from) {
      setDeniedPath(decodeURIComponent(from));
    } else {
      setDeniedPath(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (profileLoading || !currentUser) return;

    if (!canAccessRoute(currentUser.role, pathname)) {
      const defaultDashboard = getDefaultDashboardForRole(currentUser.role);
      router.replace(`${defaultDashboard}?denied=1&from=${encodeURIComponent(pathname)}`);
    }
  }, [currentUser, pathname, profileLoading, router]);

  if (profileLoading) {
    return <p role="status" style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading account profile…</p>;
  }

  const roleName = currentUser ? ROLE_CONFIG[currentUser.role]?.displayName || currentUser.role : '';

  return (
    <>
      {deniedPath && (
        <div
          role="alert"
          style={{
            margin: '16px 0 24px',
            padding: '14px 18px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <strong>Access Restricted:</strong> Your role ({roleName}) does not have permission to access <code>{deniedPath}</code>.
            You have been redirected to your authorized portal.
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '4px 10px', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            onClick={() => setDeniedPath(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </>
  );
}
