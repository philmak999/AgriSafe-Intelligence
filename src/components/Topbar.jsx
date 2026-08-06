import React from 'react';

export default function Topbar({ title, subtitle, role, onRoleChange, showRoleToggle }) {
  return (
    <div className="topbar">
      <div className="topbar-title-group">
        <div className="topbar-title">{title}</div>
        <div className="topbar-subtitle">{subtitle}</div>
      </div>

      <div className="topbar-actions">
        {showRoleToggle && (
          <div className="role-toggle">
            <button
              className={`role-toggle-btn${role === 'producer' ? ' active' : ''}`}
              onClick={() => onRoleChange('producer')}
            >
              Producer view
            </button>
            <button
              className={`role-toggle-btn${role === 'inspector' ? ' active' : ''}`}
              onClick={() => onRoleChange('inspector')}
            >
              Inspector view
            </button>
          </div>
        )}

        <div className="alert-pill">
          <span className="alert-dot" />
          3 active alerts
        </div>
      </div>
    </div>
  );
}
