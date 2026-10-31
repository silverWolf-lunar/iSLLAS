'use client';

import React, { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { ZimbabweFlag } from '../components/ZimbabweFlag';

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  // Contact Details Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+263 77 123 4567');
  const [physicalAddress, setPhysicalAddress] = useState('Makombe Complex, Block 2, Harare');
  const [province, setProvince] = useState('Harare');
  const [district, setDistrict] = useState('Harare Central');

  // Notification Preferences State (Section 4.3.1 Specification)
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [leaseExpiryReminders, setLeaseExpiryReminders] = useState(true);
  const [gazetteBulletins, setGazetteBulletins] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState(true);

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.name) {
      const parts = user.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSaveContactDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Simulate backend update or persist to local session
      await new Promise(resolve => setTimeout(resolve, 600));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-stack settings-page">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.2)', color: 'var(--primary-400)' }}>
              SYSTEM PREFERENCES
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <ZimbabweFlag width={16} height={10} />
              <span>User Profile &amp; Notification Configuration</span>
            </div>
          </div>
          <h1 style={{ fontSize: '1.875rem', color: '#ffffff', margin: 0 }}>
            Profile &amp; Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>
            Update your official contact details, communication channels, and statutory notification preferences.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => signOut({ callbackUrl: '/signin' })}
          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
        >
          Sign Out of SLLAS
        </button>
      </div>

      {saveSuccess && (
        <div style={{
          padding: '12px 18px',
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: '8px',
          color: '#86efac',
          fontSize: '0.875rem',
        }}>
          ✅ Profile contact details and notification preferences saved successfully.
        </div>
      )}

      {/* Main Form: Contact Details */}
      <section className="glass-panel settings-section" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.125rem', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>👤</span> Contact Details &amp; Jurisdiction
        </h2>
        <form onSubmit={handleSaveContactDetails} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                First Name
              </label>
              <input
                type="text"
                className="glass-input"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Last Name / Surname
              </label>
              <input
                type="text"
                className="glass-input"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Official Email Address
              </label>
              <input
                type="email"
                className="glass-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Contact Phone (E.164 format)
              </label>
              <input
                type="tel"
                className="glass-input"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Administrative Province
              </label>
              <select
                className="glass-input"
                value={province}
                onChange={e => setProvince(e.target.value)}
              >
                <option value="Harare">Harare Metropolitan</option>
                <option value="Bulawayo">Bulawayo Metropolitan</option>
                <option value="Mashonaland West">Mashonaland West</option>
                <option value="Mashonaland Central">Mashonaland Central</option>
                <option value="Mashonaland East">Mashonaland East</option>
                <option value="Manicaland">Manicaland</option>
                <option value="Midlands">Midlands</option>
                <option value="Masvingo">Masvingo</option>
                <option value="Matabeleland North">Matabeleland North</option>
                <option value="Matabeleland South">Matabeleland South</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                District Station
              </label>
              <input
                type="text"
                className="glass-input"
                value={district}
                onChange={e => setDistrict(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Physical Office or Residential Address
            </label>
            <input
              type="text"
              className="glass-input"
              value={physicalAddress}
              onChange={e => setPhysicalAddress(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{ minWidth: '180px' }}
            >
              {isSaving ? 'Updating Profile…' : 'Save Contact Details'}
            </button>
          </div>
        </form>
      </section>

      {/* Notification Preferences */}
      <section className="glass-panel settings-section" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.125rem', color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔔</span> Statutory Notification Preferences
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '20px' }}>
          Specify how SLLAS notifies you regarding lease milestones, application transitions, and regulatory publications.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>📱 SMS Status Alerts</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive real-time cellular SMS notifications upon application status progression or board review.</div>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={e => setSmsAlerts(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-500)' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>📧 Official Email Dispatches</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Send copies of formal lease indentures, offer letters, and PDF receipts to your registered email.</div>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={e => setEmailNotifs(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-500)' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>⏰ Lease Expiry Reminders (90-Day, 60-Day, 30-Day)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automated statutory countdown reminders before lease term lapse or ground rental anniversary.</div>
            </div>
            <input
              type="checkbox"
              checked={leaseExpiryReminders}
              onChange={e => setLeaseExpiryReminders(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-500)' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>🏛️ Government Gazette Statutory Bulletins</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive notices when the Ministry gazettes new agricultural land policies, rental fee schedules, or SI revisions.</div>
            </div>
            <input
              type="checkbox"
              checked={gazetteBulletins}
              onChange={e => setGazetteBulletins(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-500)' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>🛡️ Security &amp; Audit Alerts</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alerts on sign-ins from unrecognized locations or repeated authentication failures.</div>
            </div>
            <input
              type="checkbox"
              checked={systemAlerts}
              onChange={e => setSystemAlerts(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-500)' }}
            />
          </label>
        </div>
      </section>

      {/* Appearance */}
      <section className="glass-panel settings-section" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.125rem', color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎨</span> Display Appearance
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '16px' }}>
          Toggle between dark contrast mode and institutional high-readability daylight mode.
        </p>
        <ThemeSwitcher mobile />
      </section>

      {/* Account & System Metadata */}
      <section className="glass-panel settings-section" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.125rem', color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>ℹ️</span> Identity &amp; Platform Metadata
        </h2>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div><strong>Signed-in Subject:</strong> <code>{user?.email || 'Authenticated User'}</code></div>
          <div><strong>Active Role:</strong> <code>{(user as any)?.role || 'CLIENT'}</code></div>
          <div><strong>System Version:</strong> SLLAS v0.2.0 • Build 2026.10</div>
          <div><strong>Authority:</strong> Republic of Zimbabwe — Ministry of Lands, Agriculture, Fisheries, Water &amp; Rural Development</div>
        </div>
      </section>
    </div>
  );
}
