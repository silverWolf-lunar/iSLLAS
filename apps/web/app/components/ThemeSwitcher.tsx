'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

type Theme = 'light' | 'dark' | 'system';

const options: Array<{ value: Theme; label: string; icon: string }> = [
  { value: 'light', label: 'Light', icon: '☼' },
  { value: 'dark', label: 'Dark', icon: '☾' },
  { value: 'system', label: 'System', icon: '◐' },
];

export function ThemeSwitcher({ mobile = false }: { mobile?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <span className={mobile ? 'theme-switcher-mobile placeholder-control' : 'theme-switcher placeholder-control'} aria-hidden="true" />;

  const activeTheme = (theme ?? 'system') as Theme;
  const icon = activeTheme === 'system'
    ? '◐'
    : resolvedTheme === 'dark'
      ? '☾'
      : '☼';

  if (mobile) {
    return (
      <div className="theme-settings-control">
        <div className="theme-segmented" role="group" aria-label="Theme">
          {options.map(option => (
            <button
              type="button"
              key={option.value}
              className={activeTheme === option.value ? 'active' : ''}
              aria-pressed={activeTheme === option.value}
              onClick={() => setTheme(option.value)}
            >
              <span aria-hidden="true">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
        <p>System follows your device setting.</p>
      </div>
    );
  }

  return (
    <div className="theme-switcher">
      <button
        type="button"
        className="theme-trigger"
        aria-label="Change theme"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <span aria-hidden="true">{icon}</span>
      </button>
      {open && (
        <div className="theme-menu" role="menu" aria-label="Theme options">
          {options.map(option => (
            <button
              type="button"
              role="menuitemradio"
              aria-checked={activeTheme === option.value}
              className={activeTheme === option.value ? 'active' : ''}
              key={option.value}
              onClick={() => {
                setTheme(option.value);
                setOpen(false);
              }}
            >
              <span aria-hidden="true">{option.icon}</span>
              {option.label}
              {activeTheme === option.value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
