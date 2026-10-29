'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../components/AppContext';
import { Role, UserStatus } from '@sllas/contracts';

interface UserRecord {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phoneNumber?: string;
  role: string;
  provinceId?: string;
  districtId?: string;
  status: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { provinces } = useApp();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);

  // Form Processing State
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: Role.REGISTRY_OFFICER as string,
    provinceId: '',
    districtId: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'REGISTRY_OFFICER',
    provinceId: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch('/api/backend/api/v1/users');
      if (res.ok) {
        const payload = await res.json();
        const rawUsers: any[] = Array.isArray(payload) ? payload : (payload.data || []);
        const mappedUsers: UserRecord[] = rawUsers.map(u => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          phoneNumber: u.phoneNumber || '',
          role: u.role,
          provinceId: u.provinceId,
          districtId: u.districtId,
          status: u.status || 'ACTIVE',
          createdAt: u.createdAt || new Date().toISOString(),
        }));
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  }

  // CREATE USER (POST /api/v1/users)
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);

      const res = await fetch('/api/backend/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: createForm.firstName.trim(),
          lastName: createForm.lastName.trim(),
          email: createForm.email.trim(),
          phoneNumber: createForm.phoneNumber.trim() || undefined,
          role: createForm.role,
          provinceId: createForm.provinceId || undefined,
          districtId: createForm.districtId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to provision staff user');
      }

      setSuccessMsg(`User ${createForm.email} successfully provisioned as ${createForm.role}.`);
      setShowCreateModal(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: Role.REGISTRY_OFFICER,
        provinceId: '',
        districtId: '',
      });
      await fetchUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating user');
    } finally {
      setSaving(false);
    }
  }

  // OPEN EDIT MODAL
  function handleOpenEdit(user: UserRecord) {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      provinceId: user.provinceId || '',
      status: user.status || 'ACTIVE',
    });
    setErrorMsg(null);
  }

  // UPDATE USER (PATCH /api/v1/users/:id)
  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSaving(true);
      setErrorMsg(null);

      const res = await fetch(`/api/backend/api/v1/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editForm.firstName.trim() || undefined,
          lastName: editForm.lastName.trim() || undefined,
          phoneNumber: editForm.phoneNumber.trim() || undefined,
          role: editForm.role,
          provinceId: editForm.provinceId || null,
          status: editForm.status,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update user profile');
      }

      setSuccessMsg(`User ${editingUser.email} profile updated successfully.`);
      setEditingUser(null);
      await fetchUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating user');
    } finally {
      setSaving(false);
    }
  }

  // TOGGLE STATUS
  async function handleToggleStatus(user: UserRecord) {
    const nextStatus = user.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/backend/api/v1/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error('Status update failed');
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      setSuccessMsg(`User ${user.email} status set to ${nextStatus}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  }

  // DELETE USER (DELETE /api/v1/users/:id)
  async function handleConfirmDelete() {
    if (!deletingUser) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/backend/api/v1/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete user');
      }

      setSuccessMsg(`User ${deletingUser.email} has been removed from the platform.`);
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    } finally {
      setSaving(false);
    }
  }

  // ROLE BADGES
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', label: 'Admin' };
      case 'APPROVER':
        return { bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-400)', label: 'Approver' };
      case 'ESTATES_OFFICER':
        return { bg: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', label: 'Estates' };
      case 'REGISTRY_OFFICER':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', label: 'Officer' };
      case 'AUDITOR':
        return { bg: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', label: 'Auditor' };
      default:
        return { bg: 'rgba(34, 197, 94, 0.2)', color: 'var(--primary-400)', label: 'Citizen / Farmer' };
    }
  };

  // FILTERED USERS
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Role filter
      if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
      // Status filter
      if (statusFilter !== 'ALL' && user.status !== statusFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = user.name?.toLowerCase().includes(q);
        const matchEmail = user.email.toLowerCase().includes(q);
        const matchPhone = user.phoneNumber?.toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  return (
    <div className="page-stack">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/admin" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              ← Admin Dashboard
            </Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              USER MANAGEMENT CRUD
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff' }}>
            Staff & User Identity Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Provision Ministry staff, assign administrative roles, manage permissions, and configure provincial boundaries.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setErrorMsg(null);
            setShowCreateModal(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Provision New User
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="glass-panel" style={{
          padding: '12px 18px',
          background: 'rgba(34, 197, 94, 0.15)',
          borderColor: 'rgba(34, 197, 94, 0.4)',
          color: 'var(--primary-400)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        borderRadius: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* Search Input */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search users by name, email, or phone…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              background: 'rgba(2, 6, 23, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '0.875rem',
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            🔍
          </span>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            className="select-field"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(2, 6, 23, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '0.8125rem',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
            <option value="DEACTIVATED">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: `All Users (${users.length})` },
          { key: Role.CLIENT, label: 'Farmers / Clients' },
          { key: Role.REGISTRY_OFFICER, label: 'Registry Officers' },
          { key: Role.APPROVER, label: 'Board Approvers' },
          { key: Role.ESTATES_OFFICER, label: 'Estates Officers' },
          { key: Role.SYSTEM_ADMIN, label: 'Administrators' },
          { key: Role.AUDITOR, label: 'Auditors' },
        ].map(tab => {
          const isActive = roleFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRoleFilter(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: isActive ? 'var(--primary-600)' : 'rgba(15, 23, 42, 0.6)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                border: isActive ? '1px solid var(--primary-500)' : '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: '12px' }}>
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading platform users…
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '6px' }}>No users matched your criteria.</p>
            <p style={{ fontSize: '0.8125rem' }}>Try clearing your search query or role filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.85)', borderBottom: '1px solid var(--border-card)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>USER</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ROLE</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>JURISDICTION</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>REGISTERED</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const badge = getRoleBadge(user.role);
                  const provinceName = provinces.find(p => p.id === user.provinceId)?.name || 'National (All Provinces)';

                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {user.email} {user.phoneNumber && `• ${user.phoneNumber}`}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: badge.bg,
                          color: badge.color,
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {provinceName}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: user.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: user.status === 'ACTIVE' ? 'var(--primary-400)' : '#f87171',
                        }}>
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {/* Edit Button */}
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => handleOpenEdit(user)}
                          >
                            Edit
                          </button>

                          {/* Toggle Status Button */}
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              color: user.status === 'ACTIVE' ? '#fca5a5' : 'var(--primary-400)',
                            }}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                            }}
                            onClick={() => setDeletingUser(user)}
                            title="Delete user"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE USER */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '28px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>Provision New Platform User</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Staff or applicant identity onboarding</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
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

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Farai"
                    value={createForm.firstName}
                    onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Moyo"
                    value={createForm.lastName}
                    onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="e.g. fmoyo@lands.gov.zw"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. +263 77 123 4567"
                  value={createForm.phoneNumber}
                  onChange={e => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  System Role *
                </label>
                <select
                  className="select-field"
                  value={createForm.role}
                  onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                >
                  <option value={Role.CLIENT}>Citizen / Farmer (Land Applicant & Leases)</option>
                  <option value={Role.REGISTRY_OFFICER}>Registry Officer (District Cadastre & Verification)</option>
                  <option value={Role.APPROVER}>Approver (Provincial Land Board)</option>
                  <option value={Role.ESTATES_OFFICER}>Estates Officer (Waiting List & Legal Leases)</option>
                  <option value={Role.AUDITOR}>National Compliance Auditor</option>
                  <option value={Role.SYSTEM_ADMIN}>System Administrator</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Assigned Administrative Jurisdiction
                </label>
                <select
                  className="select-field"
                  value={createForm.provinceId}
                  onChange={e => setCreateForm({ ...createForm, provinceId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                >
                  <option value="">National Authority (Unrestricted All Provinces)</option>
                  {provinces.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Provisioning…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '28px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>Edit User Profile</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{editingUser.email}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
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

            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.firstName}
                    onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.lastName}
                    onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editForm.phoneNumber}
                  onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Assigned Role
                  </label>
                  <select
                    className="select-field"
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                  >
                    <option value={Role.CLIENT}>Citizen / Farmer</option>
                    <option value={Role.REGISTRY_OFFICER}>Registry Officer</option>
                    <option value={Role.APPROVER}>Land Board Approver</option>
                    <option value={Role.ESTATES_OFFICER}>Estates Officer</option>
                    <option value={Role.AUDITOR}>Compliance Auditor</option>
                    <option value={Role.SYSTEM_ADMIN}>System Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Account Status
                  </label>
                  <select
                    className="select-field"
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Administrative Jurisdiction
                </label>
                <select
                  className="select-field"
                  value={editForm.provinceId}
                  onChange={e => setEditForm({ ...editForm, provinceId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                >
                  <option value="">National Authority (All Provinces)</option>
                  {provinces.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving Changes…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deletingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '28px',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}>
                ⚠️
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', color: '#ffffff', margin: 0 }}>Delete User Account</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confirm irreversible action</span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Are you sure you want to delete user <strong style={{ color: '#ffffff' }}>{deletingUser.name}</strong> (<code>{deletingUser.email}</code>)? This will revoke system credentials and remove user permissions.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={saving}
                onClick={() => setDeletingUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                onClick={handleConfirmDelete}
              >
                {saving ? 'Deleting…' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
