import React from 'react';
import { timeAgo } from '../utils/timeAgo';

export default function AutomationSummary({ report }) {
  if (!report) return null;

  const notified = report.byStatus?.notified || 0;
  const attention =
    (report.byStatus?.notify_failed || 0) + (report.byStatus?.investigation_failed || 0);
  const lastRun = report.lastRun;

  const cards = [
    {
      label: 'Tracked Items',
      value: String(report.totalTracked),
      colorClass: 'color-teal',
      delta: 'Farms currently under automated follow-up',
    },
    {
      label: 'Notified',
      value: String(notified),
      colorClass: 'color-green',
      delta: 'Email follow-ups sent',
    },
    {
      label: 'Needs Attention',
      value: String(attention),
      colorClass: attention > 0 ? 'color-red' : 'color-green-mid',
      delta: attention > 0 ? 'Investigation or notification failed' : 'No failures',
    },
    {
      label: 'Last Loop Run',
      value: lastRun ? timeAgo(lastRun.at) : '—',
      colorClass: 'color-amber',
      delta: lastRun
        ? `${lastRun.sourced} sourced · ${lastRun.processed} processed · ${lastRun.notified} notified`
        : 'Loop has not run yet',
    },
  ];

  return (
    <div className="metric-grid">
      {cards.map((c) => (
        <div className="metric-card" key={c.label}>
          <div className="metric-label">{c.label}</div>
          <div className={`metric-value ${c.colorClass}`} style={{ fontSize: '30px' }}>{c.value}</div>
          <div className="metric-delta">{c.delta}</div>
        </div>
      ))}
    </div>
  );
}
