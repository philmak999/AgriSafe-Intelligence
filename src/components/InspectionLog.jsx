import React from 'react';
import { inspectionHistory } from '../data/mockData';

export default function InspectionLog({ scopeFarm }) {
  const inspections = scopeFarm
    ? inspectionHistory.filter((i) => i.facility === scopeFarm).slice(0, 5)
    : inspectionHistory.slice(0, 5);

  return (
    <div className="inspection-log-card">
      <div className="panel-header">
        <span className="card-title" style={{ marginBottom: 0 }}>
          {scopeFarm ? 'Your Inspection Log' : 'NYS Inspection Log'}
        </span>
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

      {inspections.length === 0 ? (
        <div style={{ color: 'var(--gray)', fontSize: '13px', padding: '4px 0' }}>
          No inspection records on file for your farm.
        </div>
      ) : (
        inspections.map((insp) => (
          <div className="inspection-row" key={`${insp.facility}-${insp.date}`}>
            <span className={`status-dot ${insp.status}`} />
            <div className="insp-facility-info">
              <div className="insp-facility-name">{insp.facility}</div>
              <div className="insp-meta">
                {insp.date} · {insp.pathogen}
              </div>
            </div>
            <span className={`status-tag ${insp.status}`}>{insp.status}</span>
          </div>
        ))
      )}
    </div>
  );
}
