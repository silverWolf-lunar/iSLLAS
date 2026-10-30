'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeSwitcherProps {
  mobile?: boolean;
  variant?: 'toggle' | 'segmented' | 'dropdown' | 'icon-only';
  className?: string;
  showLabel?: boolean;
}

export function ThemeSwitcher({
  mobile = false,
  variant,
  className = '',
  showLabel = false,
}: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        className={`theme-switcher-placeholder ${mobile ? 'theme-switcher-mobile' : ''} ${className}`}
        aria-hidden="true"
        style={{ width: mobile || variant === 'segmented' ? '100%' : '38px', height: '38px', borderRadius: '8px' }}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';
  const activeTheme = (theme ?? 'system') as ThemeMode;

  // Direct 1-click toggle function between light and dark
  const handleDirectToggle = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // SVGs for high-definition rendering
  const SunIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );

  const MoonIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

  const SystemIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );

  // Segmented 3-Pill Control (for Settings, mobile drawers, or explicit segmented variant)
  if (mobile || variant === 'segmented') {
    return (
      <div className={`theme-settings-control ${className}`}>
        <div className="theme-segmented" role="group" aria-label="Theme mode selection">
          <button
            type="button"
            className={activeTheme === 'light' ? 'active' : ''}
            aria-pressed={activeTheme === 'light'}
            onClick={() => setTheme('light')}
            title="Switch to Light mode"
          >
            <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
              <SunIcon />
            </span>
            <span>Light</span>
          </button>
          <button
            type="button"
            className={activeTheme === 'dark' ? 'active' : ''}
            aria-pressed={activeTheme === 'dark'}
            onClick={() => setTheme('dark')}
            title="Switch to Dark mode"
          >
            <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }}>
              <MoonIcon />
            </span>
            <span>Dark</span>
          </button>
          <button
            type="button"
            className={activeTheme === 'system' ? 'active' : ''}
            aria-pressed={activeTheme === 'system'}
            onClick={() => setTheme('system')}
            title="Follow system OS setting"
          >
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <SystemIcon />
            </span>
            <span>Auto</span>
          </button>
        </div>
        <p className="theme-helper-text">
          {activeTheme === 'system'
            ? `Syncing with device OS setting (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`
            : `Set to ${activeTheme === 'dark' ? 'Dark Slate' : 'Light Canvas'} appearance`}
        </p>
      </div>
    );
  }

  // Interactive Quick 1-Click Toggle with Option Dropdown
  return (
    <div className={`theme-switcher ${className}`} ref={menuRef}>
      {/* 1-Click Quick Toggle Button */}
      <button
        type="button"
        className="theme-trigger"
        aria-label={`Current theme: ${activeTheme}. Click to switch to ${isDark ? 'Light' : 'Dark'} mode.`}
        title={`Click to switch to ${isDark ? 'Light' : 'Dark'} mode`}
        onClick={handleDirectToggle}
      >
        <span className="theme-icon-wrapper" style={{ color: isDark ? '#fbbf24' : '#0284c7' }}>
          {isDark ? <SunIcon /> : <MoonIcon />}
        </span>
        {showLabel && (
          <span className="theme-trigger-label">
            {isDark ? 'Light' : 'Dark'}
          </span>
        )}
      </button>

      {/* Mini Options Chevron for choosing System mode */}
      <button
        type="button"
        className="theme-chevron-trigger"
        aria-label="Theme options menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(prev => !prev);
        }}
        title="Theme selection menu"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="theme-menu" role="menu" aria-label="Choose color theme">
          <div className="theme-menu-header">Appearance</div>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={activeTheme === 'light'}
            className={activeTheme === 'light' ? 'active' : ''}
            onClick={() => {
              setTheme('light');
              setOpen(false);
            }}
          >
            <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
              <SunIcon />
            </span>
            <span>Light Mode</span>
            {activeTheme === 'light' && <span className="theme-check" aria-hidden="true">✓</span>}
          </button>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={activeTheme === 'dark'}
            className={activeTheme === 'dark' ? 'active' : ''}
            onClick={() => {
              setTheme('dark');
              setOpen(false);
            }}
          >
            <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }}>
              <MoonIcon />
            </span>
            <span>Dark Mode</span>
            {activeTheme === 'dark' && <span className="theme-check" aria-hidden="true">✓</span>}
          </button>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={activeTheme === 'system'}
            className={activeTheme === 'system' ? 'active' : ''}
            onClick={() => {
              setTheme('system');
              setOpen(false);
            }}
          >
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <SystemIcon />
            </span>
            <span>System Default</span>
            {activeTheme === 'system' && <span className="theme-check" aria-hidden="true">✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}
