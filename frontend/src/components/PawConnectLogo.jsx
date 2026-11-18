import React from 'react';
import '../styles/brand-logo.css';

/**
 * PawConnectLogo
 * Authentic, handcrafted brand logo component for PawConnect.
 * Combines an organic pet paw emblem intertwined with a heart loop and modern typography.
 */
const PawConnectLogo = ({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  variant = 'full', // 'full' | 'mark-only' | 'stacked'
  theme = 'light', // 'light' (dark text) | 'dark' (white text) | 'admin' (gold accent)
  showSubtitle = false,
  subtitleText = 'Pet Adoption & Rescue',
  className = '',
  style = {},
}) => {
  // Dimension presets for the emblem mark
  const sizeMap = {
    sm: { markSize: 28, fontSize: '1.05rem', subSize: '0.62rem', gap: '0.45rem' },
    md: { markSize: 36, fontSize: '1.28rem', subSize: '0.70rem', gap: '0.6rem' },
    lg: { markSize: 46, fontSize: '1.55rem', subSize: '0.78rem', gap: '0.75rem' },
    xl: { markSize: 64, fontSize: '2.1rem', subSize: '0.90rem', gap: '0.95rem' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isDark = theme === 'dark';
  const isAdmin = theme === 'admin';

  return (
    <div
      className={`pawconnect-logo-container size-${size} variant-${variant} theme-${theme} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: currentSize.gap,
        textDecoration: 'none',
        ...style,
      }}
    >
      {/* Authentic Vector Brand Emblem */}
      <div
        className="pawconnect-logo-mark"
        style={{
          width: currentSize.markSize,
          height: currentSize.markSize,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <svg
          viewBox="0 0 64 64"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={`pcBgGrad-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {isAdmin ? (
                <>
                  <stop offset="0%" stopColor="#14382A" />
                  <stop offset="60%" stopColor="#0B1F17" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#0E3929" />
                  <stop offset="55%" stopColor="#14533C" />
                  <stop offset="100%" stopColor="#10B981" />
                </>
              )}
            </linearGradient>

            <linearGradient id={`pcHeartGrad-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {isAdmin ? (
                <>
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FCD34D" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#10B981" />
                </>
              )}
            </linearGradient>

            <filter id={`pcGlow-${theme}`} x="-15%" y="-15%" width="130%" height="130%" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#062217" floodOpacity="0.22" />
            </filter>
          </defs>

          {/* Rounded Squircle Emblem Badge */}
          <rect
            x="2"
            y="2"
            width="60"
            height="60"
            rx="16"
            fill={`url(#pcBgGrad-${theme})`}
            filter={`url(#pcGlow-${theme})`}
          />

          {/* Inner Gloss Contour */}
          <rect
            x="3.2"
            y="3.2"
            width="57.6"
            height="57.6"
            rx="14.8"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.2"
            strokeWidth="1.2"
          />

          {/* 4 Organically Tilted Toe Pads */}
          <ellipse cx="20.5" cy="22" rx="3.5" ry="4.8" transform="rotate(-24 20.5 22)" fill="#FFFFFF" fillOpacity="0.95" />
          <ellipse cx="28" cy="17" rx="3.8" ry="5.2" transform="rotate(-8 28 17)" fill="#FFFFFF" fillOpacity="0.98" />
          <ellipse cx="36.5" cy="17.5" rx="3.8" ry="5.2" transform="rotate(10 36.5 17.5)" fill="#FFFFFF" fillOpacity="0.98" />
          <ellipse cx="43.5" cy="23" rx="3.5" ry="4.8" transform="rotate(26 43.5 23)" fill="#FFFFFF" fillOpacity="0.95" />

          {/* Central Paw Pad with Heart Shape Contour */}
          <path
            d="M 23 35.5 C 21 31 24.5 27 28.5 27 C 31 27 33 28.5 34 30 C 35 28.5 37 27 39.5 27 C 43.5 27 47 31 45 35.5 C 43 40 37 45.5 34 47.5 C 31 45.5 25 40 23 35.5 Z"
            fill="#FFFFFF"
          />

          {/* Embracing Loop with Heart Rhythm */}
          <path
            d="M 33 46 C 39 48 48 45 49 37 C 50 29 44 26 41 27 C 45 28.5 47 33 45.5 37.5 C 44 42 38 44 33 43 C 27 42 22 36.5 23.5 31 C 24 29 25.5 27.5 27.5 27"
            stroke={`url(#pcHeartGrad-${theme})`}
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Golden Adoption Spark */}
          <circle cx="48" cy="25" r="2.4" fill={isAdmin ? "#FCD34D" : "#FBBF24"} />
        </svg>
      </div>

      {/* Typography: "PawConnect" */}
      {variant !== 'mark-only' && (
        <div className="pawconnect-logo-text-wrap" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div
            className="pawconnect-brand-wordmark"
            style={{
              fontSize: currentSize.fontSize,
              fontWeight: 800,
              fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
              letterSpacing: '-0.025em',
              display: 'flex',
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                color: isDark ? '#FFFFFF' : '#14382A',
                fontWeight: 800,
              }}
            >
              Paw
            </span>
            <span
              style={{
                color: isAdmin ? '#D4AF37' : '#10B981',
                fontWeight: 800,
                marginLeft: '1px',
              }}
            >
              Connect
            </span>
            {isAdmin && (
              <span
                style={{
                  fontSize: '0.58em',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginLeft: '0.45rem',
                  padding: '0.12rem 0.38rem',
                  background: 'rgba(212, 175, 55, 0.18)',
                  color: '#D4AF37',
                  borderRadius: '4px',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  alignSelf: 'center',
                }}
              >
                Admin
              </span>
            )}
          </div>

          {(showSubtitle || variant === 'stacked') && (
            <span
              className="pawconnect-brand-subtitle"
              style={{
                fontSize: currentSize.subSize,
                fontWeight: 600,
                color: isDark ? '#9CA3AF' : '#6B7280',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}
            >
              {subtitleText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PawConnectLogo;
