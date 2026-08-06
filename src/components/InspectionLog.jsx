import React from 'react';
import { inspectionHistory } from '../data/mockData';

const inspections = inspectionHistory.slice(0, 5);

export default function InspectionLog() {
  return (
    <div className="inspection-log-card">
      <div className="panel-header">
        <span className="card-title" style={{ marginBottom: 0 }}>NYS Inspection Log</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--gray)',
          }}
        >
          Last 5 results
        </span>
      </div>

      {inspections.map((insp) => (
        <div className="inspection-row" key={insp.facility}>
          <span className={`status-dot ${insp.status}`} />
          <div className="insp-facility-info">
            <div className="insp-facility-name">{insp.facility}</div>
            <div className="insp-meta">
              {insp.date} · {insp.pathogen}
            </div>
          </div>
          <span className={`status-tag ${insp.status}`}>{insp.status}</span>
        </div>
      ))}
    </div>
  );
}
