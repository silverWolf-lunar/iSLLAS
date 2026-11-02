'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Redirecting to System Administrator Console...</p>
      </div>
    </div>
  );
}
