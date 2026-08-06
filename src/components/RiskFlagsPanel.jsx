import React from 'react';
import { riskFlags } from '../data/mockData';
import RiskInvestigationButton from './RiskInvestigationButton';

export default function RiskFlagsPanel() {
  return (
    <div className="risk-flags-card">
      <div className="panel-header">
        <span className="card-title" style={{ marginBottom: 0 }}>Active Risk Flags</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--gray)',
          }}
        >
          {riskFlags.length} herds
        </span>
      </div>

      {riskFlags.map((flag) => (
        <div className="risk-flag-row" key={flag.farm}>
          <div className="risk-farm-info">
            <div className="risk-farm-name">{flag.farm}</div>
            <div className="risk-farm-meta">
              {flag.location} · {flag.type} · {flag.headCount}
            </div>
          </div>
          <span className={`risk-badge ${flag.risk}`}>{flag.risk}</span>
          <span className={`risk-score ${flag.risk}`}>{flag.score}</span>
          <RiskInvestigationButton farmName={flag.farm} />
        </div>
      ))}
    </div>
  );
}
