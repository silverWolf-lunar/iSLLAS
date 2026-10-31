'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/signin?mode=register');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% -20%, rgba(22, 101, 52, 0.25) 0%, rgba(10, 15, 29, 0.95) 70%, #060913 100%)',
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '0.875rem',
      gap: '8px',
    }}>
      <div className="spinner" style={{ width: '20px', height: '20px' }} />
      <span>Loading Citizen Registration Portal…</span>
    </div>
  );
}
