'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Logo } from '../components/Logo';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Role, ClientType } from '@sllas/contracts';
import { getDefaultDashboardForRole } from '../lib/access';
import { ZimbabweFlag } from '../components/ZimbabweFlag';

const ZIMBABWE_PROVINCES = [
  'Harare',
  'Bulawayo',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
];

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
    label: 'System Admin',
    role: Role.SYSTEM_ADMIN,
    email: 'admin@sllas.gov.zw',
    icon: '🛡️',
    badgeColor: '#ef4444',
    description: 'Executive console & platform management',
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
    label: 'Resettlement Officer',
    role: Role.REGISTRY_OFFICER,
    email: 'officer@sllas.gov.zw',
    icon: '📋',
    badgeColor: '#10b981',
    description: 'Cadastre registration, verification & allocation',
  },
];

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // Toggle between Sign In and Registration
  const [authMode, setAuthMode] = useState<'signin' | 'register'>(() => {
    return searchParams.get('mode') === 'register' || searchParams.get('tab') === 'register'
      ? 'register'
      : 'signin';
  });

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.SYSTEM_ADMIN);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Security Lock-out State (Section 4.3.1 Specification)
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sllas_signin_failed_attempts');
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sllas_signin_lockout_until');
      const val = stored ? parseInt(stored, 10) : null;
      if (val && val > Date.now()) return val;
    }
    return null;
  });
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number>(0);

  React.useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemainingSec(0);
      return;
    }
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemainingSec(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        sessionStorage.removeItem('sllas_signin_lockout_until');
        sessionStorage.removeItem('sllas_signin_failed_attempts');
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  // Registration State (Stage 0 Citizen Onboarding)
  const [regClientType] = useState<ClientType>(ClientType.INDIVIDUAL);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regRegistrationNumber, setRegRegistrationNumber] = useState('');
  const [regNationalId, setRegNationalId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regProvince, setRegProvince] = useState(ZIMBABWE_PROVINCES[0]);
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regErrorMessage, setRegErrorMessage] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  const urlError = searchParams.get('error');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMessage(null);
    setRegSuccessMessage(null);

    if (!regFirstName.trim() || !regLastName.trim()) {
      setRegErrorMessage('Please enter your legal first and last name.');
      return;
    }

    if (!regEmail.trim()) {
      setRegErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!regPhone.trim()) {
      setRegErrorMessage('Please enter a valid Zimbabwean contact phone number.');
      return;
    }

    if (regClientType === ClientType.INDIVIDUAL && !regNationalId.trim()) {
      setRegErrorMessage('National ID / Passport Number is mandatory for individual citizens.');
      return;
    }

    if (regClientType === ClientType.BUSINESS && !regCompanyName.trim()) {
      setRegErrorMessage('Registered Company or Farm Name is required for agribusinesses.');
      return;
    }

    if (regPassword.length < 8) {
      setRegErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (!regTermsAccepted) {
      setRegErrorMessage('You must declare statutory compliance under the Agricultural Land Settlement Act.');
      return;
    }

    try {
      setRegLoading(true);

      const payload = {
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        email: regEmail.trim(),
        phoneNumber: regPhone.trim(),
        nationalIdNumber: regClientType === ClientType.INDIVIDUAL ? regNationalId.trim() : null,
        companyName: regClientType === ClientType.BUSINESS ? regCompanyName.trim() : null,
        registrationNumber: regClientType === ClientType.BUSINESS ? regRegistrationNumber.trim() : null,
        clientType: regClientType,
        address: regAddress.trim() || `${regProvince}, Zimbabwe`,
        password: regPassword,
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete registration. Please check your information.');
      }

      setRegSuccessMessage('Account registered successfully! Authenticating your secure citizen session…');

      const authResult = await signIn('credentials', {
        redirect: false,
        email: regEmail.trim(),
        password: regPassword,
        role: Role.CLIENT,
        callbackUrl: '/client',
      });

      if (authResult?.error) {
        setAuthMode('signin');
        setEmail(regEmail.trim());
        setErrorMessage('Account created. Please enter your credentials to complete sign in.');
        setRegLoading(false);
      } else {
        router.push('/client');
      }
    } catch (err: any) {
      setRegErrorMessage(err?.message || 'Registration failed. Please check your details.');
      setRegLoading(false);
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (lockoutUntil && Date.now() < lockoutUntil) {
      setErrorMessage(`Security Lock-Out Active: Too many failed attempts. Please wait ${lockoutRemainingSec}s before retrying.`);
      return;
    }

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
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sllas_signin_failed_attempts', String(nextAttempts));
        }

        // Statutory Audit Log of failed authentication attempt
        fetch('/api/backend/api/v1/audit/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'LOGIN_FAILED',
            entityType: 'AUTH',
            entityId: email.trim(),
            actorEmail: email.trim(),
            actorRole: role,
            metadata: {
              attemptNumber: nextAttempts,
              error: result.error,
              clientTimestamp: new Date().toISOString(),
            },
          }),
        }).catch(() => {});

        if (nextAttempts >= 5) {
          const lockTime = Date.now() + 5 * 60 * 1000;
          setLockoutUntil(lockTime);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('sllas_signin_lockout_until', String(lockTime));
          }
          setErrorMessage('Security Alert: 5 consecutive failed login attempts detected. Your session has been temporarily locked out for 5 minutes in accordance with Section 4.3 security protocols.');
        } else {
          setErrorMessage(`${result.error} (Failed attempt ${nextAttempts}/5 before temporary lockout)`);
        }
        setLoading(false);
      } else if (result?.ok) {
        setFailedAttempts(0);
        setLockoutUntil(null);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('sllas_signin_failed_attempts');
          sessionStorage.removeItem('sllas_signin_lockout_until');
        }
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: isLight
        ? 'radial-gradient(ellipse at 50% -20%, rgba(22, 101, 52, 0.12) 0%, rgba(241, 245, 249, 0.95) 70%, #f8fafc 100%)'
        : 'radial-gradient(ellipse at 50% -20%, rgba(22, 101, 52, 0.25) 0%, rgba(10, 15, 29, 0.95) 70%, #060913 100%)',
      color: isLight ? '#0f172a' : '#f8fafc',
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
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Logo variant="compact" theme={isLight ? 'light' : 'dark'} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isLight ? '#334155' : 'var(--text-muted)' }}>
            ← Back to Public Land Portal & Process Guide
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeSwitcher />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: isLight ? '#b45309' : 'var(--accent-400)',
            background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.1)',
            border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.25)',
            padding: '4px 12px',
            borderRadius: '999px',
            fontWeight: 500,
          }}>
            <ZimbabweFlag width={18} height={12} />
            <span>Republic of Zimbabwe • Ministry of Lands</span>
          </div>
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
          background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isLight
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)'
            : '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
        }}>
          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: isLight ? '#f1f5f9' : 'rgba(2, 6, 23, 0.6)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '22px',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMessage(null); setRegErrorMessage(null); }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: authMode === 'signin' ? 700 : 500,
                border: 'none',
                background: authMode === 'signin' ? (isLight ? '#ffffff' : '#16a34a') : 'transparent',
                color: authMode === 'signin' ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#64748b' : 'var(--text-muted)'),
                boxShadow: authMode === 'signin' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>🔑</span>
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMessage(null); setRegErrorMessage(null); }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: authMode === 'register' ? 700 : 500,
                border: 'none',
                background: authMode === 'register' ? (isLight ? '#ffffff' : '#16a34a') : 'transparent',
                color: authMode === 'register' ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#64748b' : 'var(--text-muted)'),
                boxShadow: authMode === 'register' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>📝</span>
              <span>Register New Account</span>
            </button>
          </div>

          {/* ============================================================ */}
          {/* MODE: SIGN IN */}
          {/* ============================================================ */}
          {authMode === 'signin' && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <Logo variant="full" theme={isLight ? 'light' : 'dark'} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '16px', marginBottom: '6px', color: isLight ? '#0f172a' : '#ffffff' }}>
                  Sign In to SLLAS Portal
                </h1>
                <p style={{ fontSize: '0.875rem', color: isLight ? '#64748b' : 'var(--text-muted)', lineHeight: 1.5 }}>
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
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: isLight ? '#334155' : '#e2e8f0' }}>
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
                      background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: isLight ? '#0f172a' : '#ffffff',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                {/* Password Input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: isLight ? '#334155' : '#e2e8f0' }}>
                      Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isLight ? '#16a34a' : 'var(--primary-400)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 600,
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
                      background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: isLight ? '#0f172a' : '#ffffff',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                {/* Temporary Lock-out Banner */}
                {lockoutRemainingSec > 0 && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#fca5a5',
                    fontSize: '0.8125rem',
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}>
                    🔒 <strong>Account Temporarily Locked Out</strong><br />
                    Too many repeated sign-in failures. Retry available in: <strong>{Math.floor(lockoutRemainingSec / 60)}m {lockoutRemainingSec % 60}s</strong>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || lockoutRemainingSec > 0}
                  style={{
                    marginTop: '10px',
                    padding: '12px 18px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: lockoutRemainingSec > 0 ? 0.6 : 1,
                    cursor: lockoutRemainingSec > 0 ? 'not-allowed' : 'pointer',
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

              {/* Callout to Register if no account */}
              <div style={{
                marginTop: '20px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.1)',
                border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(22, 163, 74, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8125rem',
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: isLight ? '#15803d' : 'var(--primary-400)' }}>
                    Don't have an account yet?
                  </div>
                  <div style={{ fontSize: '0.75rem', color: isLight ? '#475569' : 'var(--text-muted)' }}>
                    Register for citizen land applications and 99-year leases.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setErrorMessage(null); }}
                  style={{
                    background: isLight ? '#15803d' : 'var(--primary-600)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Register →
                </button>
              </div>

            </>
          )}

          {/* ============================================================ */}
          {/* MODE: CITIZEN REGISTRATION (Stage 0) */}
          {/* ============================================================ */}
          {authMode === 'register' && (
            <>
              <div style={{ marginBottom: '18px' }}>
                <Logo variant="full" theme={isLight ? 'light' : 'dark'} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.2)',
                    color: isLight ? '#1e40af' : '#60a5fa',
                    border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.3)',
                  }}>
                    STAGE 0 ONBOARDING
                  </span>
                  <span style={{ fontSize: '0.75rem', color: isLight ? '#64748b' : 'var(--text-muted)' }}>
                    Role: Citizen / Client
                  </span>
                </div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 6px', color: isLight ? '#0f172a' : '#ffffff' }}>
                  Register Citizen Account
                </h1>
                <p style={{ fontSize: '0.8125rem', color: isLight ? '#64748b' : 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                  Create your profile to apply for agricultural land, join provincial waiting lists, and manage 99-year leases.
                </p>
              </div>

              {regErrorMessage && (
                <div role="alert" style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>⚠️</span>
                  <div>{regErrorMessage}</div>
                </div>
              )}

              {regSuccessMessage && (
                <div role="status" style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#86efac',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>🎉</span>
                  <div>{regSuccessMessage}</div>
                </div>
              )}

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Name Fields (2 columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      First Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Tendai"
                      value={regFirstName}
                      onChange={e => setRegFirstName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Last Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Moyo"
                      value={regLastName}
                      onChange={e => setRegLastName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>
                </div>

                {/* Company Name if Corporate */}
                {regClientType === ClientType.BUSINESS && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                        Company / Farm Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Mazowe Agro Enterprises"
                        value={regCompanyName}
                        onChange={e => setRegCompanyName(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                          color: isLight ? '#0f172a' : '#ffffff',
                          fontSize: '0.8125rem',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                        Company Reg Number
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. 12345/2021"
                        value={regRegistrationNumber}
                        onChange={e => setRegRegistrationNumber(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                          color: isLight ? '#0f172a' : '#ffffff',
                          fontSize: '0.8125rem',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* National ID / Passport Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                    Zimbabwe National ID or Passport Number {regClientType === ClientType.INDIVIDUAL && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 63-1234567 A 42"
                    value={regNationalId}
                    onChange={e => setRegNationalId(e.target.value)}
                    required={regClientType === ClientType.INDIVIDUAL}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: isLight ? '#0f172a' : '#ffffff',
                      fontSize: '0.8125rem',
                    }}
                  />
                </div>

                {/* Email and Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="e.g. citizen@gmail.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Phone Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="e.g. +263771234567"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>
                </div>

                {/* Province & Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Domicile Province <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="select-field"
                      value={regProvince}
                      onChange={e => setRegProvince(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.8)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {ZIMBABWE_PROVINCES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Physical / Farm Address
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Stand 104, Norton"
                      value={regAddress}
                      onChange={e => setRegAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>
                </div>

                {/* Password and Confirm Password */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: isLight ? '#334155' : '#e2e8f0' }}>
                        Password (min 8 chars) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setRegShowPassword(v => !v)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isLight ? '#16a34a' : 'var(--primary-400)',
                          fontSize: '0.6875rem',
                          cursor: 'pointer',
                          padding: 0,
                          fontWeight: 600,
                        }}
                      >
                        {regShowPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="••••••••••••"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="••••••••••••"
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>
                </div>

                {/* Statutory Declaration Checkbox */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.4)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.75rem',
                  lineHeight: 1.4,
                  color: isLight ? '#475569' : 'var(--text-muted)',
                }}>
                  <input
                    type="checkbox"
                    id="regTerms"
                    checked={regTermsAccepted}
                    onChange={e => setRegTermsAccepted(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#16a34a', cursor: 'pointer' }}
                  />
                  <label htmlFor="regTerms" style={{ cursor: 'pointer' }}>
                    I declare that all particulars are true and accurate under the{' '}
                    <strong>Agricultural Land Settlement Act [Chapter 20:01]</strong> and consent to electronic identity verification.
                  </label>
                </div>

                {/* Submit Registration Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={regLoading}
                  style={{
                    marginTop: '6px',
                    padding: '12px 18px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {regLoading ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px' }} />
                      <span>Registering Citizen Account…</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Sign In</span>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Link back to Sign In */}
              <div style={{
                marginTop: '16px',
                textAlign: 'center',
                fontSize: '0.8125rem',
                color: isLight ? '#64748b' : 'var(--text-muted)',
              }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setRegErrorMessage(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isLight ? '#16a34a' : 'var(--primary-400)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Sign In to SLLAS Portal →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Fast Demo Access & System Assurance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Statutory Registration Guidance Panel (shown in register mode) */}
          {authMode === 'register' && (
            <div className="glass-panel" style={{
              padding: '24px 28px',
              borderRadius: '16px',
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isLight ? '0 4px 12px rgba(0, 0, 0, 0.05)' : undefined,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>🇿🇼</span>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: isLight ? '#0f172a' : '#ffffff' }}>
                  Citizen Onboarding Guidelines
                </h2>
              </div>
              <p style={{ fontSize: '0.8125rem', color: isLight ? '#64748b' : 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                Public registration provides immediate access to the <strong>Citizen & Farmer Portal</strong> for land settlement, waiting list tracking, and 99-year lease management.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.5)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  <div style={{ fontWeight: 600, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '2px' }}>
                    🌾 Smallholder Farmers (A1)
                  </div>
                  <div style={{ color: isLight ? '#64748b' : 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Requires a valid Zimbabwe National ID. Enables applying for resettlement land up to standard regional agro-ecological boundaries.
                  </div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.5)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  <div style={{ fontWeight: 600, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '2px' }}>
                    🏢 Commercial Enterprises (A2)
                  </div>
                  <div style={{ color: isLight ? '#64748b' : 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Provides agribusiness entities with bankable 99-year leasehold rights, subject to business plan and tax clearance verification.
                  </div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.1)',
                  border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.25)',
                  color: isLight ? '#b45309' : 'var(--accent-400)',
                  fontSize: '0.75rem',
                }}>
                  <strong>⚠️ Government Officer Accounts:</strong> Ministry Registry Officers, Land Board Approvers, Estates Officers, and Auditors are provisioned exclusively by the System Administrator and cannot self-register.
                </div>
              </div>
            </div>
          )}

          {/* Quick Demo Switcher Card */}
          <div className="glass-panel" style={{
            padding: '28px',
            borderRadius: '16px',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: isLight ? '0 4px 12px rgba(0, 0, 0, 0.05)' : undefined,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: isLight ? '#dcfce7' : 'rgba(22, 163, 74, 0.2)',
                color: isLight ? '#15803d' : 'var(--primary-400)',
                border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(22, 163, 74, 0.3)',
              }}>
                RAPID ACCESS
              </span>
              <span style={{ fontSize: '0.8125rem', color: isLight ? '#64748b' : 'var(--text-muted)' }}>
                Demonstration & Role Verification
              </span>
            </div>

            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '8px' }}>
              Select a Persona to Sign In Directly
            </h2>
            <p style={{ fontSize: '0.8125rem', color: isLight ? '#64748b' : 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.5 }}>
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
                    background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.5)',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = demo.badgeColor;
                    e.currentTarget.style.background = isLight ? '#f1f5f9' : 'rgba(2, 6, 23, 0.8)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.5)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{demo.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isLight ? '#0f172a' : '#ffffff' }}>
                        {demo.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: isLight ? '#64748b' : 'var(--text-muted)' }}>
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
            background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.4)',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.75rem',
            color: isLight ? '#475569' : 'var(--text-dim)',
            lineHeight: 1.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLight ? '#0f172a' : '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
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
        color: isLight ? '#64748b' : 'var(--text-dim)',
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
