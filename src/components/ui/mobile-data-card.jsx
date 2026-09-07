import React from 'react';

/**
 * Reusable Mobile Data Card Component
 * Shared master component across Backtest Engine, PAN Slots, and Mobile Stack lists
 * Guarantees 100% identical compact spacing, low profile padding, typography, and divider layout.
 */
export function MobileDataCard({
  title,
  subtitle,
  topRightBadge,
  bottomLeft,
  bottomRight,
  onClick,
  style = {}
}) {
  return (
    <div
      onClick={onClick}
      className="mobile-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '10px 14px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        ...style
      }}
    >
      {/* Top Section: Title/Subtitle (Left) + Badge (Right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-h)', lineHeight: '1.25', margin: 0 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.2' }}>
              {subtitle}
            </div>
          )}
        </div>
        {topRightBadge && (
          <div style={{ flexShrink: 0, marginLeft: '8px' }}>
            {topRightBadge}
          </div>
        )}
      </div>

      {/* Bottom Section: Separated by tight dashed border */}
      {(bottomLeft || bottomRight) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', marginTop: '2px', borderTop: '1px dashed var(--border)', fontSize: '11.5px' }}>
          <div>{bottomLeft}</div>
          {bottomRight && (
            <div>
              {bottomRight}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MobileDataCard;
