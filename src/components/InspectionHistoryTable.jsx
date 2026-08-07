import React from 'react';
import { inspectionHistory } from '../data/mockData';

export default function InspectionHistoryTable({ scopeFarm }) {
  const history = scopeFarm ? inspectionHistory.filter((i) => i.facility === scopeFarm) : inspectionHistory;

  return (
    <div className="inspector-table-card">
      <div className="panel-header">
        <span className="card-title" style={{ marginBottom: 0 }}>
          {scopeFarm ? 'Your Inspection History' : 'Full Inspection History'}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)' }}>
          {history.length} records
        </span>
      </div>

      {history.length === 0 ? (
        <div style={{ padding: '14px 4px', color: 'var(--gray)', fontSize: '13px' }}>
          No inspection records on file for your farm.
        </div>
      ) : (
        <table className="inspector-table">
          <thead>
            <tr>
              <th>Facility</th>
              <th>Date</th>
              <th>Inspector</th>
              <th>Pathogen Screen</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => (
              <tr key={`${row.facility}-${row.date}-${i}`}>
                <td style={{ fontWeight: 500 }}>{row.facility}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>{row.date}</td>
                <td style={{ color: 'var(--gray-dark)' }}>{row.inspector}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-dark)' }}>{row.pathogen}</td>
                <td><span className={`status-tag ${row.status}`}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
