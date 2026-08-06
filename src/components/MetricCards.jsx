import React from 'react';

const producerMetrics = [
  {
    label: 'Avg MRI Score',
    value: '73.2',
    colorClass: 'color-teal',
    delta: '↑ 2.4 pts from last week',
  },
  {
    label: 'Herds Monitored',
    value: '148',
    colorClass: 'color-green',
    delta: '12 Ontario · 136 NYS',
  },
  {
    label: 'Inspection Pass Rate',
    value: '91%',
    colorClass: 'color-green-mid',
    delta: '↑ 3% vs prior quarter',
  },
  {
    label: 'High-Risk Herds',
    value: '7',
    colorClass: 'color-red',
    delta: '↑ 2 flagged this week',
  },
];

const inspectorMetrics = [
  {
    label: 'Facilities Under Review',
    value: '14',
    colorClass: 'color-teal',
    delta: 'Active monitoring',
  },
  {
    label: 'Avg Upstream MRI Score',
    value: '61.4',
    colorClass: 'color-amber',
    delta: 'Below safe threshold',
  },
  {
    label: 'Violations This Quarter',
    value: '9',
    colorClass: 'color-red',
    delta: 'Q1 2026',
  },
  {
    label: 'Recalls Initiated',
    value: '2',
    colorClass: 'color-red',
    delta: 'Active recall status',
  },
];

export default function MetricCards({ role }) {
  const metrics = role === 'inspector' ? inspectorMetrics : producerMetrics;

  return (
    <div className="metric-grid">
      {metrics.map((m) => (
        <div className="metric-card" key={m.label}>
          <div className="metric-label">{m.label}</div>
          <div className={`metric-value ${m.colorClass}`}>{m.value}</div>
          <div className="metric-delta">{m.delta}</div>
        </div>
      ))}
    </div>
  );
}
