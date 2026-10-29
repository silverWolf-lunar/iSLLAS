'use client';

import React from 'react';
import { Header } from './Header';
import { useApp } from './AppContext';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const { currentUser, setCurrentUser, profileLoading, profileError } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header currentUser={currentUser} onUserChange={setCurrentUser} />
      <main style={{ flex: 1, padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {profileLoading
          ? <p role="status">Loading your SLLAS account…</p>
          : profileError
            ? <p role="alert">{profileError}</p>
            : children}
      </main>
      <footer style={{
        padding: '24px 32px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(10, 15, 29, 0.95)',
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--primary-400)', fontWeight: 600 }}>SLLAS v0.2.0</span>
          <span>•</span>
          <span>Ministry of Lands, Agriculture, Fisheries, Water and Rural Development</span>
          <span>•</span>
          <span>Government of Zimbabwe</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
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
