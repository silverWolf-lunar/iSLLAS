'use client';

import { signOut, useSession } from 'next-auth/react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="page-stack settings-page">
      <div>
        <h1>Settings</h1>
        <p className="settings-intro">Manage your SLLAS appearance and account access.</p>
      </div>
      <section className="glass-panel settings-section">
        <h2>Appearance</h2>
        <p className="settings-label">Theme</p>
        <ThemeSwitcher mobile />
      </section>
      <section className="glass-panel settings-section">
        <h2>Account</h2>
        <p className="settings-account">{user?.name ?? user?.email ?? 'Signed-in SLLAS user'}</p>
        <button type="button" className="btn btn-outline" onClick={() => signOut({ callbackUrl: '/signin' })}>Log out</button>
      </section>
      <section className="glass-panel settings-section">
        <h2>About</h2>
        <p>SLLAS v0.2.0</p>
        <p>SLLAS - Republic of Zimbabwe</p>
      </section>
    </div>
  );
}
