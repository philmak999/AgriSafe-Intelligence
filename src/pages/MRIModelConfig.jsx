import React, { useMemo, useState } from 'react';
import MRIWeightSlider from '../components/MRIWeightSlider';
import BiosecurityGauge from '../components/BiosecurityGauge';

const FACTORS = [
  { key: 'vaccination', label: 'Vaccination coverage', color: '#1D9E75', weightPct: 35, invert: false },
  { key: 'antibiotic', label: 'Antibiotic compliance', color: '#639922', weightPct: 30, invert: false },
  { key: 'herdDensity', label: 'Herd density risk', color: '#EF9F27', weightPct: 20, invert: true },
  { key: 'outbreakProximity', label: 'Outbreak proximity', color: '#E24B4A', weightPct: 15, invert: true },
];

const DEFAULTS = { vaccination: 82, antibiotic: 76, herdDensity: 55, outbreakProximity: 38 };

export default function MRIModelConfig() {
  const [values, setValues] = useState(DEFAULTS);
  const [threshold, setThreshold] = useState(40);
  const [savedAt, setSavedAt] = useState(null);

  const compositeScore = useMemo(() => {
    const score = FACTORS.reduce((acc, f) => {
      const raw = values[f.key];
      const contribution = f.invert ? 100 - raw : raw;
      return acc + (contribution * f.weightPct) / 100;
    }, 0);
    return Math.round(score);
  }, [values]);

  const statusLabel = compositeScore < threshold
    ? 'Critical — below alert threshold'
    : compositeScore < 70
      ? 'Moderate — good'
      : 'Strong — low risk';

  const handleChange = (key) => (val) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const previewSubIndexes = FACTORS.map((f) => ({
    name: f.label,
    pct: values[f.key],
    color: f.color,
  }));

  return (
    <div className="mid-row">
      <div className="card config-panel">
        <div className="card-title">Sub-Index Weights</div>

        {FACTORS.map((f) => (
          <MRIWeightSlider
            key={f.key}
            label={f.label}
            value={values[f.key]}
            onChange={handleChange(f.key)}
            color={f.color}
            weightPct={f.weightPct}
          />
        ))}

        <div className="config-field">
          <div className="config-field-header">
            <span className="subindex-name">Alert threshold</span>
            <span className="subindex-pct">{threshold}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="config-slider"
            style={{ accentColor: '#5F5E5A' }}
          />
        </div>

        <div className="config-actions">
          <button className="btn-primary" onClick={handleSave}>Save configuration</button>
          {savedAt && <span className="config-status-msg">Saved at {savedAt}</span>}
        </div>
      </div>

      <BiosecurityGauge score={compositeScore} statusLabel={statusLabel} subIndexes={previewSubIndexes} />
    </div>
  );
}
