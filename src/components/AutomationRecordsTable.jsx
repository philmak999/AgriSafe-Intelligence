import React, { useState } from 'react';
import { timeAgo } from '../utils/timeAgo';

const STATUS_META = {
  sourced: { cls: 'REVIEW', label: 'Sourced' },
  investigating: { cls: 'REVIEW', label: 'Investigating…' },
  notifying: { cls: 'REVIEW', label: 'Notifying…' },
  notified: { cls: 'PASS', label: 'Notified' },
  notify_skipped: { cls: 'REVIEW', label: 'Notify skipped' },
  notify_failed: { cls: 'FAIL', label: 'Notify failed' },
  investigation_failed: { cls: 'FAIL', label: 'Investigation failed' },
};

export default function AutomationRecordsTable({ records }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="inspector-table-card">
      <div className="panel-header">
        <span className="card-title" style={{ marginBottom: 0 }}>Tracked Follow-Ups</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)' }}>
          {records.length} farms
        </span>
      </div>

      {records.length === 0 ? (
        <div style={{ padding: '18px 4px', color: 'var(--gray)', fontSize: '13px' }}>
          Nothing tracked yet — the automation loop sources new items on its own cycle.
        </div>
      ) : (
        <table className="inspector-table">
          <thead>
            <tr>
              <th>Farm</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Source</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const meta = STATUS_META[r.status] || { cls: 'REVIEW', label: r.status };
              const isOpen = expanded === r.id;
              return (
                <React.Fragment key={r.id}>
                  <tr onClick={() => setExpanded(isOpen ? null : r.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 500 }}>{r.farmName}</td>
                    <td>{r.riskLevel && <span className={`risk-badge ${r.riskLevel}`}>{r.riskLevel}</span>}</td>
                    <td><span className={`status-tag ${meta.cls}`}>{meta.label}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-dark)' }}>
                      {r.sourceReason}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>
                      {timeAgo(r.updatedAt)}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={5} style={{ background: 'var(--surface-secondary)', padding: '12px 10px' }}>
                        {r.investigation ? (
                          <div className="automation-detail">
                            {r.investigation.summary && <p><strong>Summary:</strong> {r.investigation.summary}</p>}
                            {r.investigation.recommendation && (
                              <p><strong>Recommendation:</strong> {r.investigation.recommendation}</p>
                            )}
                            {r.notification && !r.notification.ok && (
                              <p style={{ color: 'var(--red-dark)' }}>
                                Notification issue: {r.notification.error}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--gray)', fontSize: '12.5px' }}>No investigation results yet.</span>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
