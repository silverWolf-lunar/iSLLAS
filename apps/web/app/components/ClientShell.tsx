'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useApp } from './AppContext';
import { RoleGate } from './RoleGate';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, profileLoading, profileError, retryProfile } = useApp();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Restore sidebar collapse state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sllas_sidebar_collapsed');
      if (saved !== null) {
        setIsSidebarCollapsed(saved === 'true');
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Close mobile sidebar on route transition
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sllas_sidebar_collapsed', next ? 'true' : 'false');
      } catch {
        // Ignore localStorage write errors
      }
      return next;
    });
  };

  // Public Landing Page and Sign-in render standalone
  if (pathname === '/signin' || pathname === '/') {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      {/* Side Navigation Panel */}
      <Sidebar
        currentUser={currentUser}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content & Top Header Area */}
      <div className={`app-content-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          currentUser={currentUser}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="app-main">
          {profileLoading ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ width: '24px', height: '24px', marginBottom: '12px', display: 'inline-block' }} />
              <p>Loading your SLLAS account profile…</p>
            </div>
          ) : profileError ? (
            <div className="account-load-error" role="alert" style={{ margin: '40px auto', maxWidth: '480px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
              <p>{profileError}</p>
              <button type="button" className="btn btn-outline" onClick={retryProfile} style={{ marginTop: '12px' }}>
                Retry Account Sync
              </button>
            </div>
          ) : (
            <Suspense fallback={<p role="status" style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading portal…</p>}>
              <RoleGate>{children}</RoleGate>
            </Suspense>
          )}
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
            <span>Strict Segregation of Duties Enforced</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
