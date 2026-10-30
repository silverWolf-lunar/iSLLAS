'use client';

import React from 'react';

interface ZimbabweFlagProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ZimbabweFlag({
  width = 20,
  height = 13,
  className = '',
  style = {},
}: ZimbabweFlagProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 600 300"
      className={className}
      style={{
        borderRadius: '2px',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.35)',
        ...style,
      }}
      role="img"
      aria-label="Flag of Zimbabwe"
    >
      {/* 7 Horizontal Stripes: Green, Yellow, Red, Black, Red, Yellow, Green */}
      <rect width="600" height="42.857" y="0" fill="#006400" />
      <rect width="600" height="42.857" y="42.857" fill="#ffd200" />
      <rect width="600" height="42.857" y="85.714" fill="#d40000" />
      <rect width="600" height="42.857" y="128.571" fill="#000000" />
      <rect width="600" height="42.857" y="171.428" fill="#d40000" />
      <rect width="600" height="42.857" y="214.285" fill="#ffd200" />
      <rect width="600" height="42.857" y="257.142" fill="#006400" />

      {/* White Equilateral Triangle with Black Border */}
      <polygon points="0,0 200,150 0,300" fill="#ffffff" stroke="#000000" strokeWidth="6" />

      {/* Red 5-pointed Star */}
      <polygon
        points="65,95 73,122 101,122 78,138 87,165 65,148 43,165 52,138 29,122 57,122"
        fill="#d40000"
      />

      {/* Gold Great Zimbabwe Bird Profile */}
      <path
        d="M58,118 Q65,110 70,116 Q73,124 67,136 Q64,146 60,152 L55,152 Q58,142 57,130 Z"
        fill="#ffd200"
      />
    </svg>
  );
}
