import React from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../routes';

const SeedlingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 17V9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 13C10 13 7 11 5 8C5 8 8 5 11 6C13 7 13 10 10 13Z" fill="white" fillOpacity="0.9"/>
    <path d="M10 11C10 11 12.5 9 14 6.5C14 6.5 11.5 4 9 5C7 6 7 9 10 11Z" fill="white" fillOpacity="0.7"/>
  </svg>
);

const navSections = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: ROUTES.dashboard, badge: null },
      { id: 'risk-timeline', label: 'Risk Timeline', path: ROUTES.riskTimeline, badge: 3 },
      { id: 'herd-records', label: 'Herd Records', path: ROUTES.herdRecords, badge: null },
    ],
  },
  {
    label: 'Inspection',
    items: [
      { id: 'inspection-log', label: 'Inspection Log', path: ROUTES.inspectionLog, badge: null },
      { id: 'compliance-reports', label: 'Compliance Reports', path: ROUTES.complianceReports, badge: null },
    ],
  },
  {
    label: 'Science',
    items: [
      { id: 'mri-model', label: 'MRI Model Config', path: ROUTES.mriModel, badge: null },
      { id: 'pathogen-trends', label: 'Pathogen Trends', path: ROUTES.pathogenTrends, badge: null },
    ],
  },
];

const NavIcon = ({ id }) => {
  const icons = {
    'dashboard': (
      <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="6" height="6" rx="1.5" opacity="0.9"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" opacity="0.9"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" opacity="0.9"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" opacity="0.9"/>
      </svg>
    ),
    'risk-timeline': (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
        <polyline points="1,11 4,7 7,9 10,5 13,8 15,6"/>
      </svg>
    ),
    'herd-records': (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="6" r="2.5"/>
        <circle cx="11" cy="6" r="2.5"/>
        <path d="M1 13c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5"/>
        <path d="M11 9.5c2.2 0 4 1.5 4 3.5"/>
      </svg>
    ),
    'inspection-log': (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="1" width="10" height="14" rx="1.5"/>
        <line x1="5" y1="5" x2="9" y2="5"/>
        <line x1="5" y1="8" x2="10" y2="8"/>
        <line x1="5" y1="11" x2="8" y2="11"/>
        <polyline points="11,10 13,12 15,9"/>
      </svg>
    ),
    'compliance-reports': (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="12" height="12" rx="2"/>
        <polyline points="5,8 7,10 11,6"/>
      </svg>
    ),
    'mri-model': (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="6"/>
        <circle cx="8" cy="8" r="2.5"/>
        <line x1="8" y1="2" x2="8" y2="5.5"/>
        <line x1="8" y1="10.5" x2="8" y2="14"/>
      </svg>
    ),
    'pathogen-trends': (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="9" width="2.5" height="5"/>
        <rect x="6.5" y="6" width="2.5" height="8"/>
        <rect x="11" y="3" width="2.5" height="11"/>
      </svg>
    ),
  };
  return (
    <span className="nav-item-icon">
      {icons[id] || null}
    </span>
  );
};

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <SeedlingIcon />
        </div>
        <div className="sidebar-logo-text">
          <span className="logo-agrisafe">AgriSafe</span>
          <span className="logo-intelligence">Intelligence</span>
        </div>
      </div>

      <div className="sidebar-tagline">Farm-to-Fork Biosecurity</div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === ROUTES.dashboard}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <NavIcon id={item.id} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="sidebar-profile">
        <div className="profile-avatar">RO</div>
        <div className="profile-info">
          <span className="profile-name">Dr. R. Osei</span>
          <span className="profile-role">Producer · Ontario</span>
        </div>
      </div>
    </aside>
  );
}
