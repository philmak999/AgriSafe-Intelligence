import React from 'react';

export default function MRIWeightSlider({ label, value, onChange, color, weightPct }) {
  return (
    <div className="config-field">
      <div className="config-field-header">
        <span className="subindex-name">{label}</span>
        <span className="config-weight-badge">{weightPct}% of index</span>
        <span className="subindex-pct" style={{ color }}>{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="config-slider"
        style={{ accentColor: color }}
      />
    </div>
  );
}
