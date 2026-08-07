import React from 'react';
import { herds } from '../data/mockData';
import { computeMriPercentile } from '../utils/percentile';

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

function riskColorClass(risk) {
  if (risk === 'HIGH') return 'color-red';
  if (risk === 'MED') return 'color-amber';
  return 'color-teal';
}

function farmerMetrics(farmName) {
  const herd = herds.find((h) => h.farm === farmName);
  if (!herd) return [];
  const percentile = computeMriPercentile(farmName);

  return [
    { label: 'Your MRI Score', value: String(herd.mri), colorClass: riskColorClass(herd.risk), delta: `Risk level: ${herd.risk}` },
    { label: 'Vaccination Coverage', value: `${herd.vaccination}%`, colorClass: 'color-green-mid', delta: `${herd.headCount.toLocaleString()} head` },
    { label: 'Last Inspection', value: herd.lastInspection, colorClass: 'color-teal', delta: `Next due ${herd.nextInspectionDue}` },
    { label: 'Corridor Percentile', value: percentile === null ? '—' : `${percentile}th`, colorClass: 'color-green', delta: 'Biosecurity performance vs. other farms' },
  ];
}

export default function MetricCards({ mode, farmName }) {
  const metrics = mode === 'farmer' ? farmerMetrics(farmName) : inspectorMetrics;

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
