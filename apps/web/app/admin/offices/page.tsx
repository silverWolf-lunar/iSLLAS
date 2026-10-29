'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../components/AppContext';

interface OfficeRecord {
  id: string;
  name: string;
  code: string;
  provinceId: string;
  districtId?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
}

export default function AdminOfficesPage() {
  const { provinces } = useApp();
  const [offices, setOffices] = useState<OfficeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    provinceId: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
  });

  useEffect(() => {
    fetchOffices();
  }, []);

  async function fetchOffices() {
    try {
      setLoading(true);
      const res = await fetch('/api/backend/api/v1/offices');
      if (res.ok) {
        const data = await res.json();
        setOffices(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error('Failed to load offices', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOffice(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);

      const res = await fetch('/api/backend/api/v1/offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code.toUpperCase(),
          provinceId: formData.provinceId || provinces[0]?.id,
          address: formData.address,
          contactEmail: formData.contactEmail || undefined,
          contactPhone: formData.contactPhone || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create registry office');
      }

      setSuccessMsg(`Registry Office "${formData.name}" established.`);
      setShowModal(false);
      setFormData({ name: '', code: '', provinceId: '', address: '', contactEmail: '', contactPhone: '' });
      await fetchOffices();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating office');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/admin/users" style={{ color: 'var(--primary-400)', fontSize: '0.8125rem' }}>
              ← Administration
            </Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Offices</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Provincial & District Land Registry Offices
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Decentralized Ministry service centers maintaining regional cadastre books and citizen intake.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Establish New Registry Office
        </button>
      </div>

      {successMsg && (
        <div className="glass-panel" style={{ padding: '12px 18px', background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.4)', color: 'var(--primary-400)' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Offices Grid */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading registry offices…</p>
        ) : offices.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No registry offices established.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-card)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>OFFICE CODE</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>OFFICE NAME</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROVINCE</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ADDRESS / CONTACT</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {offices.map(office => {
                  const provinceName = provinces.find(p => p.id === office.provinceId)?.name || 'Zimbabwe National';

                  return (
                    <tr key={office.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-400)', fontSize: '0.875rem' }}>
                        {office.code}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>
                        {office.name}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {provinceName}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        <div>{office.address || 'Government Complex'}</div>
                        {office.contactPhone && <div>Tel: {office.contactPhone}</div>}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: office.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: office.isActive ? 'var(--primary-400)' : '#f87171',
                        }}>
                          {office.isActive ? 'OPERATIONAL' : 'DECOMMISSIONED'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Establish Office */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Establish Provincial Registry Office</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 14px', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', borderRadius: '6px', fontSize: '0.8125rem' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateOffice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Office Name *
                </label>
                <input
                  type="text"
                  required
                  className="glass-input"
                  placeholder="e.g. Mashonaland West Provincial Land Registry"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Office Code *
                  </label>
                  <input
                    type="text"
                    required
                    className="glass-input"
                    placeholder="e.g. LND-MW-01"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Province *
                  </label>
                  <select
                    className="glass-input"
                    value={formData.provinceId}
                    onChange={e => setFormData({ ...formData, provinceId: e.target.value })}
                  >
                    {provinces.map(prov => (
                      <option key={prov.id} value={prov.id}>{prov.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Physical Address
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. Makonde Government Complex, Chinhoyi"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    className="glass-input"
                    placeholder="chinhoyi.lands@lands.gov.zw"
                    value={formData.contactEmail}
                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Telephone
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="+263 67 212 345"
                    value={formData.contactPhone}
                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : 'Establish Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
