import React from 'react';
import PathogenTrendChart from '../components/PathogenTrendChart';
import PathogenFrequencyChart from '../components/PathogenFrequencyChart';

const summary = [
  { label: 'Total Detections (Q1)', value: '22', colorClass: 'color-teal', delta: '↑ 4 vs Q4 2025' },
  { label: 'Most Common Pathogen', value: 'Campylobacter', colorClass: 'color-red', delta: '8 detections this quarter' },
  { label: 'Facilities Affected', value: '5', colorClass: 'color-amber', delta: 'of 14 under review' },
  { label: 'Quarter-over-Quarter', value: '+22%', colorClass: 'color-red', delta: 'Trending upward' },
];

export default function PathogenTrends() {
  return (
    <>
      <div className="metric-grid">
        {summary.map((m) => (
          <div className="metric-card" key={m.label}>
            <div className="metric-label">{m.label}</div>
            <div className={`metric-value ${m.colorClass}`} style={{ fontSize: '26px' }}>{m.value}</div>
            <div className="metric-delta">{m.delta}</div>
          </div>
        ))}
      </div>

      <PathogenTrendChart />
      <PathogenFrequencyChart title="Pathogen Detections by Type — Q1 2026" />
    </>
  );
}
