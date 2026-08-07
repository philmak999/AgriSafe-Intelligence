import React from 'react';

export default function Topbar({ title, subtitle }) {
  return (
    <div className="topbar">
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
