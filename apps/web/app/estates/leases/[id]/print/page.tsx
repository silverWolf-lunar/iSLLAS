'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface LegalDoc {
  leaseNumber: string;
  statutoryAct: string;
  republicHeader: {
    country: string;
    ministry: string;
    department: string;
  };
  agreementTitle: string;
  preamble: string;
  parties: {
    lessor: { title: string; entity: string; address: string };
    lessee: { name: string; nationalId: string; address: string };
  };
  parcelDetails: {
    referenceNumber: string;
    province: string;
    district: string;
    areaHectares: number;
    surveyDiagramNumber?: string;
  };
  financialTerms: {
    termYears: number;
    startDate: string;
    annualRentalAmount: number;
    currency: string;
    paymentFrequency: string;
  };
  covenants: Array<{
    clauseNumber: string;
    heading: string;
    text: string;
  }>;
  signatures: {
    lessorBlock: { title: string; placeholder: string };
    lesseeBlock: { name: string; nationalId: string; placeholder: string };
    witnesses: Array<{ role: string; placeholder: string }>;
  };
  watermarkText: string;
}

export default function LeasePrintPage({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocument() {
      try {
        setLoading(true);
        const res = await fetch(`/api/backend/api/v1/leases/${params.id}/print`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to load lease print document');
        }
        const data = await res.json();
        setDoc(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading lease agreement');
      } finally {
        setLoading(false);
      }
    }
    loadDocument();
  }, [params.id]);

  if (loading) {
    return (
      <div className="page-stack" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Generating statutory legal document…</p>
      </div>
    );
  }

  if (errorMsg || !doc) {
    return (
      <div className="page-stack" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#f87171', marginBottom: '16px' }}>⚠️ {errorMsg || 'Document not found'}</p>
        <Link href="/estates/leases" className="btn btn-outline">
          ← Return to Leases
        </Link>
      </div>
    );
  }

  return (
    <div className="lease-print-container">
      {/* Print Controls Bar (hidden during printing) */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-surface)',
        padding: '14px 24px',
        borderBottom: '1px solid var(--border-card)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/estates/leases" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
            ← Back to Leases
          </Link>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Statutory Legal Agreement: {doc.leaseNumber}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '8px 20px', fontSize: '0.875rem' }}
          onClick={() => window.print()}
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* Official Legal Document Body */}
      <div className="legal-document-paper">
        {/* State Coat of Arms / Emblem & Republic Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px', borderBottom: '2px solid #000', paddingBottom: '16px' }}>
          {/* Official Zimbabwe Emblem Graphic */}
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              border: '2px solid #000',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.25rem',
              letterSpacing: '1px',
              marginBottom: '6px',
            }}>
              ZW
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px' }}>
              UNITY • FREEDOM • WORK
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0', color: '#000' }}>
            {doc.republicHeader.country}
          </h2>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', margin: '2px 0', color: '#111' }}>
            {doc.republicHeader.ministry}
          </h3>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#333' }}>
            {doc.republicHeader.department}
          </p>
          <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#555', marginTop: '4px' }}>
            Established under the {doc.statutoryAct}
          </p>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, textTransform: 'uppercase', textDecoration: 'underline', color: '#000', marginBottom: '8px' }}>
            {doc.agreementTitle}
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', fontWeight: 700, color: '#222' }}>
            LEASE AGREEMENT NO: {doc.leaseNumber}
          </div>
        </div>

        {/* Preamble */}
        <p style={{ fontSize: '0.875rem', lineHeight: '1.6', textAlign: 'justify', marginBottom: '20px', color: '#111' }}>
          {doc.preamble}
        </p>

        {/* Section 1: The Parties */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '8px', color: '#000' }}>
            1. PARTIES TO THE AGREEMENT
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.8125rem', lineHeight: '1.5' }}>
            <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
              <strong>THE LESSOR:</strong>
              <div>{doc.parties.lessor.title}</div>
              <div>{doc.parties.lessor.entity}</div>
              <div style={{ color: '#555' }}>{doc.parties.lessor.address}</div>
            </div>
            <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
              <strong>THE LESSEE:</strong>
              <div>{doc.parties.lessee.name}</div>
              <div>National ID / Reg No: <strong>{doc.parties.lessee.nationalId}</strong></div>
              <div style={{ color: '#555' }}>{doc.parties.lessee.address}</div>
            </div>
          </div>
        </div>

        {/* Section 2: Demised Parcel Details */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '8px', color: '#000' }}>
            2. DESCRIPTION OF DEMISED STATE LAND PARCEL
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 0', width: '220px', fontWeight: 600 }}>Cadastre Reference Number:</td>
                <td style={{ padding: '6px 0', fontFamily: 'monospace', fontWeight: 700 }}>{doc.parcelDetails.referenceNumber}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', fontWeight: 600 }}>Administrative Province & District:</td>
                <td style={{ padding: '6px 0' }}>{doc.parcelDetails.province} Province, {doc.parcelDetails.district} District</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', fontWeight: 600 }}>Demised Surface Extent:</td>
                <td style={{ padding: '6px 0', fontWeight: 700 }}>{doc.parcelDetails.areaHectares} Hectares (approx.)</td>
              </tr>
              {doc.parcelDetails.surveyDiagramNumber && (
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 600 }}>Surveyor-General Diagram No:</td>
                  <td style={{ padding: '6px 0' }}>{doc.parcelDetails.surveyDiagramNumber}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 3: Financial & Tenure Terms */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '8px', color: '#000' }}>
            3. TENURE & FINANCIAL CONSIDERATION
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 0', width: '220px', fontWeight: 600 }}>Tenure Duration:</td>
                <td style={{ padding: '6px 0' }}>{doc.financialTerms.termYears} (Ninety-Nine) Years commencing {new Date(doc.financialTerms.startDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', fontWeight: 600 }}>Annual Ground Rental:</td>
                <td style={{ padding: '6px 0', fontWeight: 700 }}>
                  ${doc.financialTerms.annualRentalAmount.toLocaleString()} {doc.financialTerms.currency} payable {doc.financialTerms.paymentFrequency} in advance.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4: Statutory Covenants */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '12px', color: '#000' }}>
            4. STATUTORY COVENANTS & OBLIGATIONS
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {doc.covenants.map(cov => (
              <div key={cov.clauseNumber} style={{ fontSize: '0.8125rem', lineHeight: '1.6' }}>
                <strong>Clause {cov.clauseNumber} ({cov.heading}):</strong> {cov.text}
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Execution, Signatures & Seals */}
        <div style={{ marginTop: '36px', pageBreakInside: 'avoid' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '20px', color: '#000' }}>
            5. STATUTORY EXECUTION & SIGNATURES
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px', marginBottom: '32px' }}>
            {/* Lessor Signature */}
            <div style={{ borderTop: '1px solid #000', paddingTop: '8px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase' }}>
                FOR AND ON BEHALF OF THE LESSOR:
              </div>
              <div style={{ fontSize: '0.75rem', color: '#333', marginTop: '4px' }}>
                {doc.signatures.lessorBlock.title}
              </div>
              <div style={{ fontSize: '0.75rem', fontStyle: 'italic', marginTop: '16px', color: '#666' }}>
                Official Government Stamp & Seal:
              </div>
            </div>

            {/* Lessee Signature */}
            <div style={{ borderTop: '1px solid #000', paddingTop: '8px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase' }}>
                SIGNED BY THE LESSEE:
              </div>
              <div style={{ fontSize: '0.75rem', color: '#333', marginTop: '4px' }}>
                {doc.signatures.lesseeBlock.name} (National ID: {doc.signatures.lesseeBlock.nationalId})
              </div>
              <div style={{ fontSize: '0.75rem', fontStyle: 'italic', marginTop: '16px', color: '#666' }}>
                Date: ________________________
              </div>
            </div>
          </div>

          {/* Witnesses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px' }}>
            {doc.signatures.witnesses.map((w, idx) => (
              <div key={idx} style={{ borderTop: '1px dashed #666', paddingTop: '6px', fontSize: '0.75rem' }}>
                <strong>WITNESS {idx + 1}:</strong> {w.role}
                <div style={{ marginTop: '12px' }}>Name & Signature: _________________________</div>
              </div>
            ))}
          </div>
        </div>

        {/* Watermark / Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #ddd', fontSize: '0.6875rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {doc.watermarkText}
        </div>
      </div>

      <style jsx global>{`
        .lease-print-container {
          min-height: 100vh;
          background: #1e293b;
          padding-bottom: 60px;
        }

        .legal-document-paper {
          max-width: 850px;
          margin: 30px auto;
          background: #ffffff;
          color: #000000;
          padding: 60px 70px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          border-radius: 4px;
          font-family: 'Times New Roman', Times, serif;
        }

        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }

          .no-print {
            display: none !important;
          }

          .app-shell, .app-header, .app-footer, .header-container {
            display: none !important;
          }

          .lease-print-container {
            background: #ffffff !important;
            padding: 0 !important;
          }

          .legal-document-paper {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
