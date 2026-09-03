import React from 'react';

export default function Topbar({ title, subtitle, onMenuClick }) {
  return (
    <div className="topbar">
      <button type="button" className="topbar-menu-btn" onClick={onMenuClick} aria-label="Toggle navigation">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="1.5" y1="4" x2="14.5" y2="4" />
          <line x1="1.5" y1="8" x2="14.5" y2="8" />
          <line x1="1.5" y1="12" x2="14.5" y2="12" />
        </svg>
      </button>

      <div className="topbar-title-group">
        <div className="topbar-title">{title}</div>
        <div className="topbar-subtitle">{subtitle}</div>
      </div>

      <div className="topbar-actions">
        <div className="alert-pill">
          <span className="alert-dot" />
          3 active alerts
        </div>
      </div>
    </div>
  );
}
