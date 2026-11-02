'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApproverRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/officer');
  }, [router]);

  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Redirecting to Resettlement Officer Dashboard...</p>
      </div>
    </div>
  );
}
