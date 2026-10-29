'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface KycDocument {
  id: string;
  type: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  uploadedAt: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
}

interface ClientProfileData {
  id?: string;
  userId?: string;
  clientType: 'INDIVIDUAL' | 'CORPORATE';
  firstName: string;
  lastName: string;
  nationalId: string;
  companyName?: string;
  companyNumber?: string;
  email: string;
  phone: string;
  physicalAddress: string;
  city: string;
  country: string;
  taxNumber?: string;
  verificationStatus: string;
  documents?: KycDocument[];
}

export default function ClientKycPage() {
  const [profile, setProfile] = useState<ClientProfileData>({
    clientType: 'INDIVIDUAL',
    firstName: '',
    lastName: '',
    nationalId: '',
    companyName: '',
    companyNumber: '',
    email: '',
    phone: '',
    physicalAddress: '',
    city: 'Harare',
    country: 'Zimbabwe',
    taxNumber: '',
    verificationStatus: 'UNVERIFIED',
    documents: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Document upload form state
  const [docType, setDocType] = useState('NATIONAL_ID');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await fetch('/api/backend/api/v1/client-profiles/me');
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({
          ...prev,
          ...data,
          documents: data.documents || [],
        }));
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      setSaveSuccess(false);

      const res = await fetch('/api/backend/api/v1/client-profiles/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update profile');
      }

      const updated = await res.json();
      setProfile(prev => ({ ...prev, ...updated }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      setUploading(true);
      setErrorMsg(null);
      setUploadSuccess(false);

      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(uploadFile);
      const base64Data = await base64Promise;

      // 1. Upload to storage
      const uploadRes = await fetch('/api/backend/api/v1/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadFile.name,
          mimeType: uploadFile.type || 'application/octet-stream',
          contentBase64: base64Data,
        }),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.message || 'File upload failed');
      }

      const uploadResult = await uploadRes.json();

      // 2. Attach document to client profile
      const attachRes = await fetch('/api/backend/api/v1/client-profiles/me/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: docType,
          fileName: uploadFile.name,
          fileSize: uploadFile.size,
          mimeType: uploadFile.type || 'application/octet-stream',
          storageKey: uploadResult.storageKey,
        }),
      });

      if (!attachRes.ok) {
        const err = await attachRes.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to attach document to profile');
      }

      const updatedDocs = await attachRes.json();
      setProfile(prev => ({
        ...prev,
        documents: Array.isArray(updatedDocs) ? updatedDocs : (updatedDocs.documents || []),
      }));

      setUploadFile(null);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const isVerified = profile.verificationStatus === 'VERIFIED';

  if (loading) {
    return (
      <div className="page-stack">
        <p role="status" style={{ color: 'var(--text-muted)' }}>Loading KYC Profile…</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* Breadcrumb / Top Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/client" style={{ color: 'var(--primary-400)', fontSize: '0.8125rem' }}>
              ← Client Portal
            </Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>KYC & Legal Identity</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Applicant Identity & KYC Documentation
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Verify your legal status with the Ministry of Lands under statutory regulations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            background: isVerified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: isVerified ? 'var(--primary-400)' : 'var(--accent-400)',
            border: `1px solid ${isVerified ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
          }}>
            Status: {profile.verificationStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {saveSuccess && (
        <div className="glass-panel" style={{ padding: '12px 18px', background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.4)', color: 'var(--primary-400)' }}>
          ✓ Profile details updated successfully.
        </div>
      )}

      {errorMsg && (
        <div className="glass-panel" style={{ padding: '12px 18px', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Left: Applicant Information Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👤</span> Personal & Legal Registration Details
          </h2>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Applicant Type
              </label>
              <select
                className="glass-input"
                value={profile.clientType}
                onChange={e => setProfile({ ...profile, clientType: e.target.value as any })}
                disabled={isVerified}
              >
                <option value="INDIVIDUAL">Individual Citizen (A1 / A2 Resettlement)</option>
                <option value="CORPORATE">Corporate Body / Agricultural Enterprise</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  className="glass-input"
                  required
                  value={profile.firstName}
                  onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                  disabled={isVerified}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  className="glass-input"
                  required
                  value={profile.lastName}
                  onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                  disabled={isVerified}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                National ID / Passport Number * (e.g. 63-1234567-X-42)
              </label>
              <input
                type="text"
                className="glass-input"
                required
                placeholder="63-123456-X-42"
                value={profile.nationalId}
                onChange={e => setProfile({ ...profile, nationalId: e.target.value })}
                disabled={isVerified}
              />
            </div>

            {profile.clientType === 'CORPORATE' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Registered Entity Name
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    value={profile.companyName || ''}
                    onChange={e => setProfile({ ...profile, companyName: e.target.value })}
                    disabled={isVerified}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Company Reg. No.
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    value={profile.companyNumber || ''}
                    onChange={e => setProfile({ ...profile, companyNumber: e.target.value })}
                    disabled={isVerified}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  className="glass-input"
                  required
                  value={profile.email}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Phone (Econet / NetOne) *
                </label>
                <input
                  type="tel"
                  className="glass-input"
                  required
                  placeholder="+263 77 123 4567"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Physical Residential / Office Address *
              </label>
              <textarea
                className="glass-input"
                rows={2}
                required
                value={profile.physicalAddress}
                onChange={e => setProfile({ ...profile, physicalAddress: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  City / District *
                </label>
                <input
                  type="text"
                  className="glass-input"
                  required
                  value={profile.city}
                  onChange={e => setProfile({ ...profile, city: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  ZIMRA Tax BP Number
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="BP-200XXXXX"
                  value={profile.taxNumber || ''}
                  onChange={e => setProfile({ ...profile, taxNumber: e.target.value })}
                />
              </div>
            </div>

            {!isVerified && (
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '8px' }}>
                {saving ? 'Saving…' : 'Save KYC Information'}
              </button>
            )}
          </form>
        </div>

        {/* Right: Document Upload & Verification Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Upload Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📎</span> Lodge Statutory Documents
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '16px' }}>
              Upload certified copies of required statutory documents (PDF, JPG, PNG up to 10MB).
            </p>

            {uploadSuccess && (
              <div className="glass-panel" style={{ padding: '10px 14px', marginBottom: '14px', background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.4)', color: 'var(--primary-400)', fontSize: '0.8125rem' }}>
                ✓ Document uploaded and submitted to Registry review queue.
              </div>
            )}

            <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Document Category
                </label>
                <select
                  className="glass-input"
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                >
                  <option value="NATIONAL_ID">National Identity Card / Passport</option>
                  <option value="PROOF_OF_RESIDENCE">Proof of Residence (Utility / Chief letter)</option>
                  <option value="TAX_CLEARANCE">ZIMRA ITF 263 Tax Clearance</option>
                  <option value="COMPANY_REGISTRATION">Certificate of Incorporation (CR14/CR6)</option>
                  <option value="BUSINESS_PROPOSAL">Agricultural Business Plan / Proposal</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Select File
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="glass-input"
                  style={{ padding: '8px' }}
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-accent"
                disabled={uploading || !uploadFile}
                style={{ width: '100%', marginTop: '6px' }}
              >
                {uploading ? 'Uploading & Lodging…' : 'Upload to Registry'}
              </button>
            </form>
          </div>

          {/* Uploaded Documents List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Submitted Documents</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile.documents?.length || 0} Lodged</span>
            </h3>

            {(!profile.documents || profile.documents.length === 0) ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                No documents lodged yet. Upload your National ID and Proof of Residence to initiate verification.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {profile.documents.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      gap: '12px',
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.fileName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {doc.type.replace('_', ' ')} • {(doc.fileSize / 1024).toFixed(1)} KB
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: doc.status === 'VERIFIED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: doc.status === 'VERIFIED' ? 'var(--primary-400)' : 'var(--accent-400)',
                      }}>
                        {doc.status}
                      </span>
                      <a
                        href={`/api/backend/api/v1/uploads/${encodeURIComponent(doc.storageKey)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
