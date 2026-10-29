// ─────────────────────────────────────────────────────────────
// SLLAS Design Tokens — Shared Web and Mobile Design System
// Inspired by Zimbabwean landscape (Savanna Green, Gold Ochre, Earth Slate)
// ─────────────────────────────────────────────────────────────

export const colors = {
  // Brand Primary — Regal Forest Green
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#16a34a',
    600: '#15803d',
    700: '#166534',
    800: '#14532d',
    900: '#052e16',
    DEFAULT: '#15803d',
  },
  // Brand Secondary — Zimbabwe Gold / Ochre
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    DEFAULT: '#d97706',
  },
  // Neutrals — Slate
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  // Semantic Domain Status Colors
  status: {
    // Parcel Statuses
    DRAFT: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
    PENDING_VERIFICATION: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
    AVAILABLE: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    RESERVED: { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc' },
    ALLOCATED: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
    LEASED: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
    WITHDRAWN: { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' },
    DISPUTED: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },

    // Application Statuses
    SUBMITTED: { bg: '#fef9c3', text: '#a16207', border: '#fde047' },
    UNDER_REVIEW: { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc' },
    INFO_REQUESTED: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
    SITE_INSPECTION: { bg: '#fae8ff', text: '#86198f', border: '#f0abfc' },
    APPROVED: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    REJECTED: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
    OFFER_ISSUED: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
    ACCEPTED: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    AGREEMENT_SIGNED: { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' },
    ACTIVE: { bg: '#dcfce7', text: '#166534', border: '#4ade80' },
    EXPIRING_SOON: { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
    EXPIRED: { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
  },
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
    heading: 'Outfit, Inter, sans-serif',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const radii = {
  none: '0',
  sm: '0.25rem',  // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem',   // 8px
  xl: '0.75rem',  // 12px
  '2xl': '1rem',  // 16px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;
