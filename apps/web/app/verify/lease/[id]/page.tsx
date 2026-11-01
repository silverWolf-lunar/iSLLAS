'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeaseVerificationData {
  leaseNumber: string;
  parcelReference: string;
  lesseeName: string;
  startDate: string;
  endDate: string;
  currentStatus: string;
  termYears: number;
  province: string;
  district: string;
  areaHectares: number;
  isValid: boolean;
  verifiedAt: string;
  statutoryAct: string;
  issuingAuthority: string;
}

export default function PublicLeaseVerificationPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<LeaseVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadVerification() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(`/api/backend/api/v1/leases/verify/${params.id}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Lease deed could not be verified on the national land registry.');
        }
        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to verify statutory lease deed');
      } finally {
        setLoading(false);
      }
    }
    loadVerification();
  }, [params.id]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#94a3b8',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(34, 197, 94, 0.2)',
            borderTopColor: '#22c55e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Verifying deed against National Cadastre Register…</p>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          ` }} />
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#f87171',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '36px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '8px' }}>
            Statutory Deed Verification Failed
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5' }}>
            {errorMsg || 'The requested folio reference does not match an authenticated statutory record.'}
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              borderRadius: '6px',
              background: '#22c55e',
              color: '#090d16',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            ← Return to Official Portal
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = data.currentStatus === 'CANCELLED' || data.currentStatus === 'TERMINATED';
  const isExpired = data.currentStatus === 'EXPIRED';
  const isActive = data.isValid;

  const statusConfig = isActive
    ? {
        label: 'OFFICIALLY VALID & ACTIVE',
        bg: 'rgba(34, 197, 94, 0.15)',
        border: 'rgba(34, 197, 94, 0.4)',
        color: '#4ade80',
        icon: '✓',
        desc: 'This state land lease agreement is legally authentic, in full force, and recognized by the Ministry of Lands & Rural Development.',
      }
    : isExpired
    ? {
        label: 'STATUTORILY EXPIRED',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.4)',
        color: '#fbbf24',
        icon: '⌛',
        desc: 'The tenure duration of this lease has elapsed. The underlying parcel is subject to renewal or redistribution.',
      }
    : {
        label: 'CANCELLED / TERMINATED',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        color: '#f87171',
        icon: '✕',
        desc: 'This lease has been formally surrendered or cancelled by the Ministry. It carries no legal standing for occupancy or collateral.',
      };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #131d2e 0%, #080c14 100%)',
      color: '#f1f5f9',
      padding: '36px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        maxWidth: '680px',
        margin: '0 auto',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      }}>
        {/* State Seal Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '24px', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #15803d 0%, #047857 100%)',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '1.25rem',
            letterSpacing: '1px',
            boxShadow: '0 0 24px rgba(34, 197, 94, 0.3)',
            marginBottom: '12px',
          }}>
            ZW
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', color: 'var(--accent-400, #fbbf24)', marginBottom: '4px' }}>
            REPUBLIC OF ZIMBABWE
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px', color: '#ffffff' }}>
            National Land Registry &amp; Cadastre Portal
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>
            Official Statutory Lease Deed Public Verification
          </p>
        </div>

        {/* Verification Status Banner */}
        <div style={{
          background: statusConfig.bg,
          border: `1px solid ${statusConfig.border}`,
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: statusConfig.border,
            color: statusConfig.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 900,
            flexShrink: 0,
          }}>
            {statusConfig.icon}
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: statusConfig.color, letterSpacing: '0.05em' }}>
              {statusConfig.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px', lineHeight: '1.4' }}>
              {statusConfig.desc}
            </div>
          </div>
        </div>

        {/* Certified Deed Details Table */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '12px' }}>
            Statutory Deed Records
          </h2>
          <div style={{
            background: 'rgba(2, 6, 23, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8125rem' }}>
              <span style={{ color: '#94a3b8' }}>Lease Folio Number:</span>
              <span style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>{data.leaseNumber}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8125rem' }}>
              <span style={{ color: '#94a3b8' }}>Cadastral Parcel:</span>
              <span style={{ fontWeight: 700, color: '#4ade80', fontFamily: 'monospace' }}>{data.parcelReference}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8125rem' }}>
              <span style={{ color: '#94a3b8' }}>Registered Lessee:</span>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>{data.lesseeName}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8125rem' }}>
              <span style={{ color: '#94a3b8' }}>Demised Surface Extent:</span>
              <span style={{ color: '#ffffff' }}>{data.areaHectares} Hectares</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8125rem' }}>
              <span style={{ color: '#94a3b8' }}>Jurisdiction:</span>
              <span style={{ color: '#ffffff' }}>{data.district} District, {data.province} Province</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8125rem' }}>
              <span style={{ color: '#94a3b8' }}>Statutory Tenure Term:</span>
              <span style={{ color: '#ffffff' }}>{data.termYears} (Ninety-Nine) Years</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8125rem' }}>
              <span style={{ color: '#94a3b8' }}>Commencement Date:</span>
              <span style={{ color: '#ffffff' }}>{new Date(data.startDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '12px 16px', fontSize: '0.8125rem' }}>
              <span style={{ color: '#94a3b8' }}>Determination Date:</span>
              <span style={{ color: '#ffffff' }}>{new Date(data.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Statutory Governance Note */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#64748b',
          lineHeight: '1.5',
          marginBottom: '24px',
        }}>
          <strong>Legal Notice:</strong> This digital verification certifies the statutory standing of agricultural state land leased pursuant to the {data.statutoryAct}. In accordance with the Data Protection Act [Chapter 11:12], personal identifying information (National ID numbers, banking records, contact details) is strictly omitted from public verification folios.
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#475569' }}>
          <div>Verified At: {new Date(data.verifiedAt).toLocaleString()}</div>
          <div style={{ marginTop: '4px' }}>{data.issuingAuthority}</div>
        </div>
      </div>
    </div>
  );
}
