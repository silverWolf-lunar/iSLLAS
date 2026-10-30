'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Logo } from '../components/Logo';
import { Role } from '@sllas/contracts';
import { getDefaultDashboardForRole } from '../lib/access';

interface DemoAccount {
  label: string;
  role: Role;
  email: string;
  icon: string;
  badgeColor: string;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Citizen / Farmer',
    role: Role.CLIENT,
    email: 'farmer@sllas.gov.zw',
    icon: '🌾',
    badgeColor: '#3b82f6',
    description: 'Land applicant & 99-year leaseholder',
  },
  {
    label: 'Registry Officer',
    role: Role.REGISTRY_OFFICER,
    email: 'officer@sllas.gov.zw',
    icon: '📋',
    badgeColor: '#10b981',
    description: 'District parcel & KYC verification',
  },
  {
    label: 'Land Board Approver',
    role: Role.APPROVER,
    email: 'approver@sllas.gov.zw',
    icon: '⚖️',
    badgeColor: '#f59e0b',
    description: 'Provincial board & Ministerial approvals',
  },
  {
    label: 'Estates Officer',
    role: Role.ESTATES_OFFICER,
    email: 'estates@sllas.gov.zw',
    icon: '📜',
    badgeColor: '#8b5cf6',
    description: 'Master waiting list & legal leases',
  },
  {
    label: 'System Admin',
    role: Role.SYSTEM_ADMIN,
    email: 'admin@sllas.gov.zw',
    icon: '🛡️',
    badgeColor: '#ef4444',
    description: 'Executive console & user management',
  },
  {
    label: 'Compliance Auditor',
    role: Role.AUDITOR,
    email: 'auditor@sllas.gov.zw',
    icon: '🔍',
    badgeColor: '#06b6d4',
    description: 'Independent statutory integrity oversight',
  },
];

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.CLIENT);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const urlError = searchParams.get('error');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email/username and password.');
      return;
    }

    try {
      setLoading(true);
      const targetDashboard = getDefaultDashboardForRole(role);

      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password: password.trim(),
        role,
        callbackUrl: targetDashboard,
      });

      if (result?.error) {
        setErrorMessage(result.error);
        setLoading(false);
      } else if (result?.ok) {
        router.push(targetDashboard);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demo: DemoAccount) => {
    setEmail(demo.email);
    setPassword('GovernmentSecure2026!');
    setRole(demo.role);
    setErrorMessage(null);
    setLoading(true);

    try {
      const targetDashboard = getDefaultDashboardForRole(demo.role);
      const result = await signIn('credentials', {
        redirect: false,
        email: demo.email,
        password: 'GovernmentSecure2026!',
        role: demo.role,
        callbackUrl: targetDashboard,
      });

      if (result?.error) {
        setErrorMessage(result.error);
        setLoading(false);
      } else if (result?.ok) {
        router.push(targetDashboard);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to authenticate demo account.');
      setLoading(false);
    }
  };

  const handleKeycloakSso = async () => {
    setLoading(true);
    await signIn('keycloak', { callbackUrl: '/' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(ellipse at 50% -20%, rgba(22, 101, 52, 0.25) 0%, rgba(10, 15, 29, 0.95) 70%, #060913 100%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px 16px',
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Logo variant="compact" theme={resolvedTheme === 'light' ? 'light' : 'dark'} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            ← Back to Public Land Portal & Process Guide
          </span>
        </Link>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.75rem',
          color: 'var(--accent-400)',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          padding: '4px 12px',
          borderRadius: '999px',
        }}>
          <span>🇿🇼</span>
          <span>Republic of Zimbabwe • Ministry of Lands</span>
        </div>
      </div>

      {/* Main Container */}
      <main style={{
        maxWidth: '1000px',
        width: '100%',
        margin: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '32px',
        alignItems: 'start',
      }}>
        {/* Left Column: Form */}
        <div className="glass-panel" style={{
          padding: '36px',
          borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <Logo variant="full" theme={resolvedTheme === 'light' ? 'light' : 'dark'} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '16px', marginBottom: '6px', color: '#ffffff' }}>
              Sign In to SLLAS Portal
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Enter your government or citizen credentials to access cadastral maps, applications, and statutory leases.
            </p>
          </div>

          {(errorMessage || urlError) && (
            <div role="alert" style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span>⚠️</span>
              <div>{errorMessage || 'Authentication failed. Please verify your credentials or contact the Ministry.'}</div>
            </div>
          )}

          <form onSubmit={handleCredentialsLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email / Username Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#e2e8f0' }}>
                Work Email or National ID Username <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. farmer@sllas.gov.zw or 63-123456-X"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Password Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-400)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? 'Hide password' : 'Show password'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Target Role Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#e2e8f0' }}>
                Assigned Role / Department
              </label>
              <select
                className="select-field"
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(2, 6, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                }}
              >
                <option value={Role.CLIENT}>🌾 Citizen / Farmer (Land Applicant & Leases)</option>
                <option value={Role.REGISTRY_OFFICER}>📋 District Land Registry Officer</option>
                <option value={Role.APPROVER}>⚖️ Provincial Land Board Approver</option>
                <option value={Role.ESTATES_OFFICER}>📜 Estates & Valuation Officer</option>
                <option value={Role.SYSTEM_ADMIN}>🛡️ System Administrator</option>
                <option value={Role.AUDITOR}>🔍 National Compliance Auditor</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                marginTop: '10px',
                padding: '12px 18px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px' }} />
                  <span>Verifying Credentials…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '24px 0 16px',
            color: 'var(--text-dim)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <span style={{ padding: '0 12px' }}>Or single sign-on</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleKeycloakSso}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>🏛️</span>
            <span>Sign in with Government SSO (Keycloak)</span>
          </button>
        </div>

        {/* Right Column: Fast Demo Access & System Assurance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Demo Switcher Card */}
          <div className="glass-panel" style={{
            padding: '28px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(22, 163, 74, 0.2)',
                color: 'var(--primary-400)',
                border: '1px solid rgba(22, 163, 74, 0.3)',
              }}>
                RAPID ACCESS
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Demonstration & Role Verification
              </span>
            </div>

            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              Select a Persona to Sign In Directly
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.5 }}>
              Click any verified role below to automatically authenticate and launch that role's specialized workbench.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {DEMO_ACCOUNTS.map(demo => (
                <button
                  key={demo.role}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin(demo)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = demo.badgeColor;
                    e.currentTarget.style.background = 'rgba(2, 6, 23, 0.8)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'rgba(2, 6, 23, 0.5)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{demo.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>
                        {demo.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {demo.description}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: `${demo.badgeColor}22`,
                    color: demo.badgeColor,
                    border: `1px solid ${demo.badgeColor}44`,
                  }}>
                    Log in →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Statutory Security Note */}
          <div className="glass-panel" style={{
            padding: '20px 24px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            lineHeight: 1.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
              <span>⚖️</span>
              <span>Statutory Compliance Notice</span>
            </div>
            Access to SLLAS is governed by the <strong>Agricultural Land Settlement Act (Chapter 20:01)</strong> and the <strong>Gazetted Land Act</strong>. All login attempts, spatial queries, and allocation actions are recorded in an immutable, cryptographically verifiable audit trail.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: '36px',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
      }}>
        <div>Smart Land Lease and Allocation System (SLLAS) • Republic of Zimbabwe</div>
        <div style={{ marginTop: '4px' }}>Ministry of Lands & Rural Development</div>
      </footer>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="signin-page" aria-busy="true" />}>
      <SignInContent />
    </Suspense>
  );
}
