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

  // Statutory Registration Options (Section 4.3.2 Specification)
  const TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.'];
  const GENDERS = ['Male', 'Female'];
  const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];
  const FARMER_CATEGORIES = [
    'War Veteran/War Collaborator',
    'Uniformed Forces',
    'Business Person',
    'Youth [35 years and below]',
    'Civil Servant',
    'MP/Senator',
    'ZEPDRA',
    'Ordinary',
    'Others [specify]',
  ];

  // Statutory Citizen Registration State (Specified 14 Fields)
  const [regSurname, setRegSurname] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regOtherNames, setRegOtherNames] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female'>('Male');
  const [regTitle, setRegTitle] = useState('Mr.');
  const [regDob, setRegDob] = useState('');
  const [regNationalId, setRegNationalId] = useState('');
  const [regUploadedId, setRegUploadedId] = useState<string | null>(null);
  const [regMaritalStatus, setRegMaritalStatus] = useState('Single');
  const [regCitizenship, setRegCitizenship] = useState('Zimbabwean');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFarmerCategory, setRegFarmerCategory] = useState<string>('Ordinary');
  const [regFarmerCategoryOther, setRegFarmerCategoryOther] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [isWebReviewVisible, setIsWebReviewVisible] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regErrorMessage, setRegErrorMessage] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  const urlError = searchParams.get('error');

  // Auto-detect citizenship upon ID upload or Zimbabwean ID entry
  const handleIdFileUpload = (fileName: string) => {
    setRegUploadedId(fileName);
    setRegCitizenship('Zimbabwean (Auto-detected from ID verification)');
  };

  // Step 1: Check and Verify - Validates all required fields before showing Review Screen
  const handleInitiateReview = (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMessage(null);
    setRegSuccessMessage(null);

    if (!regSurname.trim()) {
      setRegErrorMessage('Surname is required.');
      return;
    }
    if (!regFirstName.trim()) {
      setRegErrorMessage('First Name is required.');
      return;
    }
    if (!regGender) {
      setRegErrorMessage('Gender is required.');
      return;
    }
    if (!regDob) {
      setRegErrorMessage('Date of Birth is required.');
      return;
    }
    if (!regNationalId.trim()) {
      setRegErrorMessage('National ID Number is required.');
      return;
    }
    if (!regUploadedId) {
      setRegErrorMessage('Upload of your National ID is mandatory for identity verification.');
      return;
    }
    if (!regPhone.trim()) {
      setRegErrorMessage('Phone Number is required.');
      return;
    }
    if (!regAddress.trim()) {
      setRegErrorMessage('Residential Address is required.');
      return;
    }
    if (regFarmerCategory === 'Others [specify]' && !regFarmerCategoryOther.trim()) {
      setRegErrorMessage('Please specify your Farmer Category in the designated box.');
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

    // Pass all pre-validations -> launch verification review
    setIsWebReviewVisible(true);
  };

  // Step 2: Final Submission after Citizen Verification
  const handleConfirmSubmit = async () => {
    if (!regTermsAccepted) {
      setRegErrorMessage('You must certify and declare the accuracy of your details before final submission.');
      return;
    }

    try {
      setRegLoading(true);
      setRegErrorMessage(null);

      const effectiveEmail = regEmail.trim() || `${regNationalId.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@sllas.gov.zw`;

      const payload = {
        surname: regSurname.trim(),
        firstName: regFirstName.trim(),
        otherNames: regOtherNames.trim() || null,
        gender: regGender,
        title: regTitle,
        dateOfBirth: regDob,
        nationalIdNumber: regNationalId.trim(),
        idDocumentName: regUploadedId,
        maritalStatus: regMaritalStatus,
        citizenship: regCitizenship,
        phoneNumber: regPhone.trim(),
        residentialAddress: regAddress.trim(),
        email: regEmail.trim() || null,
        farmerCategory: regFarmerCategory,
        farmerCategoryOther: regFarmerCategory === 'Others [specify]' ? regFarmerCategoryOther.trim() : null,
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

      setIsWebReviewVisible(false);
      setRegSuccessMessage('Account registered and verified! Authenticating your secure citizen session…');

      const authResult = await signIn('credentials', {
        redirect: false,
        email: effectiveEmail,
        password: regPassword,
        role: Role.CLIENT,
        callbackUrl: '/client',
      });

      if (authResult?.error) {
        setAuthMode('signin');
        setEmail(effectiveEmail);
        setErrorMessage('Account verified. Please enter your credentials to complete sign in.');
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

              <form onSubmit={handleInitiateReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. Title, First Name, Surname, Other Names */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Title
                    </label>
                    <select
                      className="select-field"
                      value={regTitle}
                      onChange={e => setRegTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.8)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {TITLES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      First Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Tafadzwa"
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
                      Surname <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Chikata"
                      value={regSurname}
                      onChange={e => setRegSurname(e.target.value)}
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

                {/* 2. Other Names, Gender, Date of Birth */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Other Names (Optional)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Farai"
                      value={regOtherNames}
                      onChange={e => setRegOtherNames(e.target.value)}
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
                      Gender <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="select-field"
                      value={regGender}
                      onChange={e => setRegGender(e.target.value as 'Male' | 'Female')}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.8)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {GENDERS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Date of Birth <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={regDob}
                      onChange={e => setRegDob(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>
                </div>

                {/* 3. National ID Number & Marital Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      National ID Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 63-128944-P-63"
                      value={regNationalId}
                      onChange={e => {
                        setRegNationalId(e.target.value);
                        if (e.target.value.trim().length >= 4) {
                          setRegCitizenship('Zimbabwean (Auto-detected from ID)');
                        }
                      }}
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
                      Marital Status
                    </label>
                    <select
                      className="select-field"
                      value={regMaritalStatus}
                      onChange={e => setRegMaritalStatus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.8)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {MARITAL_STATUSES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Upload your ID & Citizenship Auto-Detection */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.6)',
                  border: isLight ? '1px dashed #94a3b8' : '1px dashed rgba(255, 255, 255, 0.2)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff' }}>
                        Upload your National ID <span style={{ color: '#ef4444' }}>*</span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: isLight ? '#64748b' : 'var(--text-muted)' }}>
                        PDF, PNG or JPG (scanned copy or front/back photo)
                      </div>
                    </div>
                    {/* Auto-detected Citizenship Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.35)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.6875rem',
                      color: '#4ade80',
                      fontWeight: 600,
                    }}>
                      <span>🇿🇼</span>
                      <span>Citizenship: {regCitizenship}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="file"
                      id="webIdUpload"
                      style={{ display: 'none' }}
                      accept=".pdf,image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleIdFileUpload(file.name);
                        }
                      }}
                    />
                    <label
                      htmlFor="webIdUpload"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        background: isLight ? '#ffffff' : '#1e293b',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>📎</span>
                      <span>{regUploadedId ? 'Replace ID File' : 'Choose File to Upload'}</span>
                    </label>

                    {/* Demonstration Quick Attachment Button */}
                    {!regUploadedId && (
                      <button
                        type="button"
                        onClick={() => handleIdFileUpload(`National_ID_${regNationalId.trim() || '63-128944'}.pdf`)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isLight ? '#2563eb' : '#60a5fa',
                          fontSize: '0.6875rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        ⚡ Attach Valid Sample ID
                      </button>
                    )}

                    {regUploadedId && (
                      <div style={{ fontSize: '0.75rem', color: isLight ? '#15803d' : '#86efac', fontWeight: 600 }}>
                        ✓ Attached: {regUploadedId}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Phone Number & Email Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Phone Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="e.g. +263 77 345 6789"
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
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="e.g. citizen@gmail.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
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

                {/* 6. Residential Address */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                    Residential Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Stand 44, Banket Commercial Farming Block, Makonde"
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
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

                {/* 7. Farmer Category Dropdown & Others Specification */}
                <div style={{ display: 'grid', gridTemplateColumns: regFarmerCategory === 'Others [specify]' ? '1fr 1fr' : '1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                      Farmer Category <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="select-field"
                      value={regFarmerCategory}
                      onChange={e => setRegFarmerCategory(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.8)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {FARMER_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {regFarmerCategory === 'Others [specify]' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: isLight ? '#334155' : '#e2e8f0' }}>
                        Specify Category Details <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Agricultural Cooperative"
                        value={regFarmerCategoryOther}
                        onChange={e => setRegFarmerCategoryOther(e.target.value)}
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
                  )}
                </div>

                {/* 8. Password and Confirm Password */}
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

                {/* Pre-Submission Review & Verification Prompt */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)',
                  border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.25)',
                  fontSize: '0.75rem',
                  color: isLight ? '#1e40af' : '#93c5fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>🔍</span>
                  <div>
                    Under statutory guidelines, you will be asked to <strong>check and verify all particulars</strong> in a summary docket before final submission.
                  </div>
                </div>

                {/* Review & Verify Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    marginTop: '4px',
                    padding: '12px 18px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#16a34a',
                  }}
                >
                  <span>Review &amp; Verify Details →</span>
                </button>
              </form>

              {/* STATUTORY CHECK & VERIFY MODAL (Pre-Submission Review Step) */}
              {isWebReviewVisible && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(3, 7, 18, 0.82)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: '16px',
                }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '560px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    backgroundColor: isLight ? '#ffffff' : '#0f172a',
                    borderRadius: '16px',
                    padding: '24px',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#16a34a', letterSpacing: '0.08em', marginBottom: '4px' }}>
                          🇿🇼 AGRICULTURAL LAND SETTLEMENT ACT • VERIFICATION
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: isLight ? '#0f172a' : '#ffffff' }}>
                          Check &amp; Verify Details
                        </h2>
                        <p style={{ fontSize: '0.8125rem', color: isLight ? '#64748b' : 'var(--text-muted)', margin: '4px 0 0' }}>
                          Please verify all particulars below before submitting your official registration.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsWebReviewVisible(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.2rem',
                          color: isLight ? '#64748b' : '#94a3b8',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Particulars Review Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      backgroundColor: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
                      padding: '14px',
                      borderRadius: '10px',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '16px',
                      fontSize: '0.8125rem',
                    }}>
                      <div>
                        <div style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.6875rem', fontWeight: 600 }}>FULL NAME</div>
                        <div style={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginTop: '2px' }}>
                          {regTitle} {regFirstName} {regOtherNames ? regOtherNames + ' ' : ''}{regSurname}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.6875rem', fontWeight: 600 }}>GENDER &amp; DATE OF BIRTH</div>
                        <div style={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginTop: '2px' }}>
                          {regGender} • Born {regDob || '—'}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.6875rem', fontWeight: 600 }}>NATIONAL ID NUMBER</div>
                        <div style={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginTop: '2px' }}>
                          {regNationalId}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.6875rem', fontWeight: 600 }}>UPLOADED ID DOCUMENT</div>
                        <div style={{ fontWeight: 700, color: '#16a34a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📎</span> {regUploadedId || 'None'}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.6875rem', fontWeight: 600 }}>CITIZENSHIP</div>
                        <div style={{ fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>
                          🇿🇼 {regCitizenship}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.6875rem', fontWeight: 600 }}>MARITAL STATUS</div>
                        <div style={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginTop: '2px' }}>
                          {regMaritalStatus}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.6875rem', fontWeight: 600 }}>PHONE NUMBER</div>
                        <div style={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginTop: '2px' }}>
                          {regPhone}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.6875rem', fontWeight: 600 }}>EMAIL ADDRESS</div>
                        <div style={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginTop: '2px' }}>
                          {regEmail || '—'}
                        </div>
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.6875rem', fontWeight: 600 }}>RESIDENTIAL ADDRESS</div>
                        <div style={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginTop: '2px' }}>
                          {regAddress}
                        </div>
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.6875rem', fontWeight: 600 }}>FARMER CATEGORY</div>
                        <div style={{ fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>
                          {regFarmerCategory} {regFarmerCategoryOther ? `(${regFarmerCategoryOther})` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Statutory Affirmation Checkbox */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.1)',
                      border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(22, 163, 74, 0.3)',
                      marginBottom: '16px',
                      fontSize: '0.75rem',
                      color: isLight ? '#15803d' : '#86efac',
                    }}>
                      <input
                        type="checkbox"
                        id="webVerifyDeclare"
                        checked={regTermsAccepted}
                        onChange={e => setRegTermsAccepted(e.target.checked)}
                        style={{ marginTop: '2px', accentColor: '#16a34a', cursor: 'pointer' }}
                      />
                      <label htmlFor="webVerifyDeclare" style={{ cursor: 'pointer', lineHeight: 1.45 }}>
                        I, <strong>{regTitle} {regFirstName} {regSurname}</strong>, hereby verify and solemnly declare that all particulars and documents submitted above are true, complete, and legally accurate under the <strong>Agricultural Land Settlement Act [Cap 20:01]</strong>.
                      </label>
                    </div>

                    {/* Action Buttons: Edit or Confirm */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setIsWebReviewVisible(false)}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: isLight ? '#f1f5f9' : '#1e293b',
                          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                          color: isLight ? '#334155' : '#cbd5e1',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        ← Edit Details
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmSubmit}
                        disabled={regLoading || !regTermsAccepted}
                        style={{
                          flex: 2,
                          padding: '10px 16px',
                          borderRadius: '8px',
                          background: regTermsAccepted ? '#16a34a' : '#64748b',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          cursor: regTermsAccepted ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          opacity: regLoading ? 0.7 : 1,
                        }}
                      >
                        {regLoading ? 'Registering Citizen…' : 'Confirm & Complete Registration ✓'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
