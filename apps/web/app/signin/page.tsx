'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Logo } from '../components/Logo';
import { useTheme } from 'next-themes';

function SignInContent() {
  const searchParams = useSearchParams();
  const [isStarting, setIsStarting] = useState<'login' | 'register' | null>(null);
  const { resolvedTheme } = useTheme();
  const authError = searchParams.get('error');
  const authReference = searchParams.get('ref');

  const errorMessage = authError === 'AccessDenied' || authError === 'access_denied'
    ? 'Access was cancelled or denied.'
    : authError === 'Configuration'
      ? 'SLLAS authentication is not configured. Contact your administrator.'
      : authError === 'OAuthSignin'
        ? 'The SLLAS identity service is unavailable or incorrectly configured.'
        : authError === 'OAuthCallback'
        ? 'The identity service could not complete the sign-in callback.'
        : authError === 'invalid_client'
          ? 'The SLLAS identity client configuration is invalid.'
          : authError === 'invalid_grant'
            ? 'The sign-in session expired. Please start again.'
            : authError === 'account_not_provisioned'
              ? 'Your identity is authenticated but has not been provisioned for SLLAS.'
              : 'Sign-in could not be completed. Please try again or contact your administrator.';

  const startAuthentication = async (mode: 'login' | 'register') => {
    setIsStarting(mode);
    await signIn(
      'keycloak',
      { callbackUrl: '/' },
      mode === 'register' ? { kc_action: 'register' } : undefined,
    );
    setIsStarting(null);
  };

  return (
    <main className="signin-page">
      <span className="signin-logo signin-logo-full"><Logo variant="full" theme={resolvedTheme === 'light' ? 'light' : 'dark'} /></span>
      <span className="signin-logo signin-logo-compact"><Logo variant="compact" theme={resolvedTheme === 'light' ? 'light' : 'dark'} /></span>
      <h1 style={{ marginTop: 12 }}>Access the land administration portal</h1>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Use the secure government identity service to sign in or create your account.
      </p>
      {authError && (
        <p role="alert" style={{
          marginTop: 20,
          padding: 12,
          borderRadius: 8,
          background: 'rgba(220, 38, 38, 0.12)',
          color: '#fca5a5',
        }}>
          {errorMessage}
          {authReference && <><br />Reference: {authReference}</>}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
        <button
          className="btn btn-primary"
          onClick={() => startAuthentication('login')}
          disabled={isStarting !== null}
        >
          {isStarting === 'login' ? 'Opening secure sign-in…' : 'Log in'}
        </button>
        <button
          className="btn btn-outline"
          onClick={() => startAuthentication('register')}
          disabled={isStarting !== null}
        >
          {isStarting === 'register' ? 'Opening registration…' : 'Create an account'}
        </button>
      </div>
      <p style={{ marginTop: 24, color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: 1.5 }}>
        Account access and registration are managed by Keycloak. Approved users may still require
        SLLAS operator provisioning before accessing registry data.
      </p>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="signin-page" aria-busy="true" />}>
      <SignInContent />
    </Suspense>
  );
}
