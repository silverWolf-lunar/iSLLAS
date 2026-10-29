'use client';

import { signIn } from 'next-auth/react';

export default function SignInPage() {
  return (
    <main style={{ maxWidth: 480, margin: '12vh auto', padding: 32, textAlign: 'center' }}>
      <h1>Sign in to SLLAS</h1>
      <p>Use your approved government identity account to continue.</p>
      <button className="btn btn-primary" onClick={() => signIn('keycloak', { callbackUrl: '/' })}>
        Continue with secure sign-in
      </button>
    </main>
  );
}
