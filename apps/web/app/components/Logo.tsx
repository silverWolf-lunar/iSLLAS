'use client';

import React from 'react';

export type LogoVariant = 'full' | 'compact' | 'icon';
export type LogoTheme = 'light' | 'dark';

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  monochrome?: 'black' | 'white';
  className?: string;
}

const ALT_TEXT = 'SLLAS – Smart Land Lease and Allocation System, Zimbabwe';

export function Logo({
  variant = 'full',
  theme = 'dark',
  monochrome,
  className,
}: LogoProps) {
  const isDark = theme === 'dark';
  const textColor = monochrome === 'black' ? '#000000' : monochrome === 'white' ? '#FFFFFF' : isDark ? '#FFFFFF' : '#1A1A1A';
  const subtitleColor = monochrome
    ? textColor
    : isDark
      ? '#C9CED6'
      : '#4A4A4A';
  const green = monochrome ?? '#006B3F';
  const stripeColors = monochrome ? [monochrome, monochrome, monochrome, monochrome] : ['#006B3F', '#FFD200', '#D40000', '#000000'];
  const iconSize = variant === 'icon' ? 32 : variant === 'compact' ? 40 : 48;

  return (
    <span
      className={`${className ?? ''} logo-${variant}`.trim()}
      role="img"
      aria-label={ALT_TEXT}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: variant === 'full' ? 14 : 0,
        color: textColor,
        minHeight: iconSize,
        fontFamily: 'Inter, "Source Sans 3", "Noto Sans", Arial, sans-serif',
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="1" y="1" width="46" height="46" rx="2" fill={green} />
        <path
          d="M31.5 14.5c-2.2-1.6-4.8-2.4-7.7-2.4-5.3 0-8.8 2.7-8.8 6.7 0 4.2 3.5 5.7 8.5 6.8 3.4.8 5.2 1.4 5.2 3.2 0 1.8-1.7 2.8-4.7 2.8-3 0-5.8-1-8-2.9l-2.1 3.8c2.8 2.2 6.2 3.3 10.1 3.3 5.8 0 9.5-2.7 9.5-7.2 0-4.1-3.1-5.8-8.3-7-3.6-.8-5.4-1.3-5.4-3 0-1.5 1.5-2.4 4.1-2.4 2.5 0 4.7.7 6.4 2.1l1.2-3.8Z"
          fill="#FFFFFF"
        />
      </svg>

      {variant !== 'icon' && (
        <span style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: 0,
          ...(variant === 'full' ? { borderLeft: `1px solid ${isDark ? '#64748B' : '#A0A0A0'}`, paddingLeft: 14 } : {}),
        }}>
          <strong style={{
            color: textColor,
            fontSize: variant === 'compact' ? '1.1rem' : '1.15rem',
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}>
            SLLAS
          </strong>
          {variant === 'full' && (
            <>
              <span style={{
                color: subtitleColor,
                fontSize: '0.68rem',
                lineHeight: 1.35,
                fontWeight: 400,
                whiteSpace: 'nowrap',
              }}>
                Smart Land Lease &amp; Allocation System
              </span>
              <span style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                marginTop: 3,
              }}>
                <span style={{
                  color: subtitleColor,
                  fontSize: '0.52rem',
                  lineHeight: 1.2,
                  letterSpacing: '0.16em',
                  fontWeight: 400,
                  whiteSpace: 'nowrap',
                }}>
                  REPUBLIC OF ZIMBABWE
                </span>
                <span style={{ display: 'flex', width: 52, height: 4, marginTop: 3 }}>
                  {stripeColors.map((color, index) => (
                    <span key={index} style={{ backgroundColor: color, flex: 1 }} />
                  ))}
                </span>
              </span>
            </>
          )}
        </span>
      )}
    </span>
  );
}
