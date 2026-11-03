'use client';

import React from 'react';

interface FilmLoaderProps {
  /** Optional label shown below the reel. Defaults to "Loading..." */
  label?: string;
  /** Size variant: sm | md | lg. Defaults to md */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * CSS-only film reel loader with amber Cinema Paradiso branding.
 * Use for page-level or full-section loading states.
 * For inline shimmer skeletons (home rails, grids), use animate-pulse instead.
 */
export default function FilmLoader({ label = 'Loading...', size = 'md' }: FilmLoaderProps) {
  const dim = size === 'sm' ? 40 : size === 'lg' ? 80 : 56;
  const strokeW = size === 'sm' ? 3 : size === 'lg' ? 5 : 4;
  const textCls = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className="flex flex-col items-center justify-center gap-4" aria-label={label} role="status">
      {/* Film reel SVG */}
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
        style={{ animationDuration: '1.2s', animationTimingFunction: 'linear' }}
      >
        {/* Outer ring */}
        <circle cx="28" cy="28" r="26" stroke="#f5a524" strokeWidth={strokeW} strokeOpacity="0.25" />
        {/* Spinning arc */}
        <circle
          cx="28"
          cy="28"
          r="26"
          stroke="#f5a524"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray="40 124"
          strokeDashoffset="0"
        />
        {/* Film sprocket holes (static look via small circles) */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 28 + 17 * Math.cos(rad);
          const cy = 28 + 17 * Math.sin(rad);
          return <circle key={angle} cx={cx} cy={cy} r="3" fill="#f5a524" fillOpacity="0.45" />;
        })}
        {/* Center hub */}
        <circle cx="28" cy="28" r="5" fill="#f5a524" fillOpacity="0.7" />
      </svg>

      {/* Label */}
      {label && (
        <span className={`${textCls} font-medium text-[#a1a1aa] tracking-wide`}>{label}</span>
      )}
    </div>
  );
}
