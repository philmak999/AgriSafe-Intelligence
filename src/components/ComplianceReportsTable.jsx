import React from 'react';
import { complianceReports } from '../data/mockData';

export default function ComplianceReportsTable({ scopeFarm }) {
  const reports = scopeFarm ? complianceReports.filter((r) => r.facility === scopeFarm) : complianceReports;

  return (
    <div className="inspector-table-card">
      <div className="panel-header">
        <span className="card-title" style={{ marginBottom: 0 }}>
          {scopeFarm ? 'Your Regulatory Filings' : 'Regulatory Filings'}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)' }}>
          {reports.length} reports
        </span>
      </div>

      {reports.length === 0 ? (
        <div style={{ padding: '14px 4px', color: 'var(--gray)', fontSize: '13px' }}>
          No compliance filings on file for your farm.
        </div>
      ) : (
        <table className="inspector-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Facility</th>
              <th>Regulation</th>
              <th>Period</th>
              <th>Filed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>{r.id}</td>
                <td style={{ fontWeight: 500 }}>{r.facility}</td>
                <td style={{ color: 'var(--gray-dark)' }}>{r.regulation}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-dark)' }}>{r.period}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>{r.filed}</td>
                <td><span className={`status-tag ${r.status}`}>{r.label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
