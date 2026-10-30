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
  const isMonochrome = Boolean(monochrome);
  const badgeBg = isMonochrome ? 'transparent' : '#FFFFFF';
  const badgeBorder = isMonochrome
    ? (monochrome === 'white' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)')
    : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0');
  const leafColor = isMonochrome ? (monochrome === 'white' ? '#FFFFFF' : '#000000') : '#2785a1';
  const stemColor = isMonochrome ? (monochrome === 'white' ? '#FFFFFF' : '#000000') : '#0a4b69';

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
        style={{
          flexShrink: 0,
          borderRadius: variant === 'icon' ? '8px' : '10px',
          boxShadow: !isMonochrome
            ? (isDark ? '0 4px 14px rgba(0, 0, 0, 0.45)' : '0 2px 8px rgba(0, 0, 0, 0.08)')
            : undefined,
        }}
      >
        {/* Rounded Squircle Badge Base */}
        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="10"
          fill={badgeBg}
          stroke={badgeBorder}
          strokeWidth="1.2"
        />

        {/* Top Central Leaf */}
        <path
          d="M 24.00 5.29 Q 25.62 6.91 27.06 9.11 Q 27.82 10.92 28.20 13.12 Q 28.01 15.79 27.44 17.51 Q 26.39 19.51 24.10 22.19 Q 22.85 21.14 21.33 19.23 Q 20.37 17.41 19.80 15.03 Q 19.99 12.16 20.75 9.96 Q 22.38 7.20 24.00 5.29 Z"
          fill={leafColor}
        />

        {/* Left Leaf with negative-space vein */}
        <path
          d="M 11.11 19.13 Q 14.55 19.42 16.46 19.99 Q 18.37 21.04 19.61 22.19 Q 20.56 23.62 21.23 25.34 Q 21.61 27.82 21.52 29.92 Q 20.18 27.63 18.84 26.10 Q 17.22 24.86 15.60 24.10 Q 15.22 24.29 15.22 24.67 Q 18.37 28.11 19.80 30.30 Q 19.99 30.97 17.89 30.97 Q 15.88 30.59 13.97 29.73 Q 12.16 28.11 10.54 25.34 Q 9.68 21.99 9.49 19.32 Q 11.02 19.23 11.11 19.13 Z"
          fill={leafColor}
        />

        {/* Right Leaf with negative-space vein */}
        <path
          d="M 36.79 21.04 Q 37.94 21.04 37.56 23.90 Q 36.32 27.44 35.08 29.35 Q 33.83 30.59 32.40 31.45 Q 30.59 32.02 28.58 32.12 Q 29.44 30.11 30.21 28.96 Q 32.50 26.48 32.59 26.01 Q 32.21 25.72 30.97 26.29 Q 29.63 27.25 28.01 28.96 Q 26.20 31.73 26.10 29.54 Q 26.58 27.15 27.34 25.53 Q 28.20 24.38 29.35 23.33 Q 31.35 22.19 34.41 21.33 Q 36.70 21.14 36.79 21.04 Z"
          fill={leafColor}
        />

        {/* Stem Trunk */}
        <path
          d="M 22.28 30.11 Q 23.33 32.69 24.00 35.46 Q 24.57 40.04 24.57 41.85 Q 24.29 42.05 23.90 41.85 Q 23.62 37.18 23.05 34.12 Q 22.09 31.26 22.19 30.21 Z"
          fill={stemColor}
        />
        {/* Stem Branch to right leaf */}
        <path
          d="M 25.43 32.12 Q 25.91 32.40 25.91 32.59 Q 24.76 35.65 24.48 34.03 Q 25.43 32.21 25.43 32.12 Z"
          fill={stemColor}
        />

        {/* Soil Base / Ground Lobes */}
        <path
          d="M 28.11 40.90 Q 29.54 40.90 30.59 41.19 Q 31.83 41.85 33.07 43.00 Q 24.14 43.00 15.22 43.00 Q 15.88 42.24 16.74 41.66 Q 18.56 40.99 20.18 40.99 Q 21.80 41.47 24.29 43.00 Q 26.58 41.38 28.01 40.99 Z"
          fill={stemColor}
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
