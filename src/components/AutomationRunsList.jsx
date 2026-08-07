import React from 'react';
import { timeAgo } from '../utils/timeAgo';

export default function AutomationRunsList({ runs }) {
  return (
    <div className="risk-flags-card">
      <div className="panel-header">
        <span className="card-title" style={{ marginBottom: 0 }}>Loop Run History</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)' }}>
          Most recent {runs.length}
        </span>
      </div>

      {runs.length === 0 ? (
        <div style={{ color: 'var(--gray)', fontSize: '13px', padding: '4px 0' }}>
          No cycles have run yet.
        </div>
      ) : (
        runs.slice(0, 12).map((run, i) => (
          <div className="risk-flag-row" key={`${run.at}-${i}`}>
            <div className="risk-farm-info">
              <div className="risk-farm-name">{timeAgo(run.at)}</div>
              <div className="risk-farm-meta">
                {run.sourced} sourced · {run.processed} processed · {run.notified} notified
                {run.failed > 0 ? ` · ${run.failed} failed` : ''} · {run.durationMs}ms
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
