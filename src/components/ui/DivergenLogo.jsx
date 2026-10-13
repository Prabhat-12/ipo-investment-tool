import React from 'react';
import divergenLogoImg from '../../assets/divergen-logo.png';

/**
 * DivergenLogo Component
 * Renders the official Divergen "D + Infinity" logomark.
 * Supports expanded, collapsed, mobile, and login display modes.
 */
export function DivergenLogo({ 
  variant = 'expanded', 
  subtitle, 
  className = '' 
}) {
  // Official Brand Mark Container with concentric radius & optical alignment
  const BrandMark = ({ size = 22, containerSize = size + 14 }) => (
    <div 
      className="divergen-mark-container img-outline icon-optical"
      style={{
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        borderRadius: containerSize <= 30 ? '8px' : '10px',
        backgroundColor: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: '3px',
        transition: 'transform 0.15s cubic-bezier(0.2, 0, 0, 1), border-color 0.15s ease'
      }}
    >
      <img
        src={divergenLogoImg}
        alt="Divergen"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );

  // 1. COLLAPSED SIDEBAR VIEW (Centered mark, 36x36 container, optical alignment)
  if (variant === 'collapsed') {
    return (
      <div 
        className={`divergen-logo-collapsed ${className}`}
        data-tooltip="Divergen"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          cursor: 'pointer'
        }}
      >
        <BrandMark size={24} containerSize={36} />
      </div>
    );
  }

  // 2. MOBILE RESPONSIVE VIEW (Compact 28px container, horizontal lockup)
  if (variant === 'mobile') {
    return (
      <div 
        className={`divergen-logo-mobile ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          userSelect: 'none'
        }}
      >
        <BrandMark size={18} containerSize={28} />
        <span 
          className="mobile-header-title"
          style={{
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '-0.3px',
            margin: 0,
            lineHeight: 1
          }}
        >
          Divergen
        </span>
      </div>
    );
  }

  // 3. LOGIN / HERO VIEW (Prominent, bold, 52px hero container)
  if (variant === 'login') {
    return (
      <div 
        className={`divergen-logo-login ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <BrandMark size={34} containerSize={52} />
        <div>
          <h1 
            style={{ 
              fontSize: '30px', 
              fontWeight: 900, 
              margin: 0, 
              letterSpacing: '-1px', 
              color: 'var(--text-h)',
              lineHeight: 1.1
            }}
          >
            Divergen
          </h1>
          {subtitle && (
            <span 
              style={{ 
                fontSize: '11px', 
                color: 'var(--accent, #e55c3c)', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                display: 'block',
                marginTop: '4px'
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 4. EXPANDED SIDEBAR VIEW (Desktop sidebar, 34px container + wordmark)
  return (
    <div 
      className={`divergen-logo-expanded ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        overflow: 'hidden'
      }}
    >
      <BrandMark size={22} containerSize={34} />
      <div style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <h1 className="sidebar-brand-name" style={{ lineHeight: 1.2 }}>
            Divergen
          </h1>
        </div>
        {subtitle && (
          <span 
            style={{ 
              fontSize: '10px', 
              fontWeight: 700, 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px', 
              display: 'block', 
              whiteSpace: 'nowrap',
              marginTop: '2px'
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default DivergenLogo;
