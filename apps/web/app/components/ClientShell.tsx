'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { useApp } from './AppContext';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, profileLoading, profileError, retryProfile } = useApp();

  if (pathname === '/signin') {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <Header currentUser={currentUser} />
      <main className="app-main">
        {profileLoading
          ? <p role="status">Loading your SLLAS account…</p>
          : profileError
            ? (
              <div className="account-load-error" role="alert">
                <p>{profileError}</p>
                <button type="button" className="btn btn-outline" onClick={retryProfile}>
                  Retry
                </button>
              </div>
            )
            : children}
      </main>
      <footer className="app-footer">
        <div className="app-footer-group">
          <span style={{ color: 'var(--primary-400)', fontWeight: 600 }}>SLLAS v0.2.0</span>
          <span>•</span>
          <span>Ministry of Lands, Agriculture, Fisheries, Water and Rural Development</span>
          <span>•</span>
          <span>Government of Zimbabwe</span>
        </div>
        <div className="app-footer-group app-footer-meta">
          <span>PostGIS Spatial SRID 4326</span>
          <span>•</span>
          <span>Keycloak OIDC Guarded</span>
          <span>•</span>
          <span>Strict Segregation of Duties Enforced</span>
        </div>
      </footer>
    </div>
  );
}
