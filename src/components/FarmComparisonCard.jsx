import React from 'react';
import { computeMriPercentile, percentileLabel } from '../utils/percentile';

export default function FarmComparisonCard({ farmName }) {
  const percentile = computeMriPercentile(farmName);

  return (
    <div className="card comparison-card">
      <div className="card-title">How You Compare</div>
      <div className="comparison-value">
        {percentile === null ? '—' : `${percentile}th`}
        <span className="comparison-unit">percentile</span>
      </div>
      <div className="comparison-label">{percentileLabel(percentile)}</div>
      <p className="comparison-note">
        Based on biosecurity (MRI) score against other farms in the Ontario + NYS corridor.
        Individual details of other farms aren't shown here.
      </p>
    </div>
  );
}
