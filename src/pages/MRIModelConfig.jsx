import { useCallback, useEffect, useState } from 'react';
import MRIWeightSlider from '../components/MRIWeightSlider';
import BiosecurityGauge from '../components/BiosecurityGauge';
import { API_BASE } from '../apiBase';
import { herds } from '../data/mockData';

const FACTOR_META = {
  vaccination: { label: 'Vaccination coverage', color: '#1D9E75' },
  antibiotic: { label: 'Antibiotic compliance', color: '#639922' },
  herdDensity: { label: 'Herd density risk', color: '#EF9F27' },
  outbreakProximity: { label: 'Outbreak proximity', color: '#E24B4A' },
};
const FACTOR_ORDER = ['vaccination', 'antibiotic', 'herdDensity', 'outbreakProximity'];
const DOCUMENT_SOURCED_KEYS = new Set(['vaccination', 'antibiotic']);

function statusLabelFor(score, threshold) {
  if (score < threshold) return 'Critical — below alert threshold';
  return score < 70 ? 'Moderate — good' : 'Strong — low risk';
}

export default function MRIModelConfig() {
  const [farmName, setFarmName] = useState(herds[0]?.farm || '');
  const [farmData, setFarmData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [draftWeights, setDraftWeights] = useState(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const [history, setHistory] = useState([]);

  const loadFarm = useCallback(() => {
    if (!farmName) return;
    setLoading(true);
    fetch(`${API_BASE}/api/mri-config?farmName=${encodeURIComponent(farmName)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setFarmData(data);
        setDraftWeights((prev) => prev || data.weights);
      })
      .finally(() => setLoading(false));
  }, [farmName]);

  const loadHistory = useCallback(() => {
    fetch(`${API_BASE}/api/mri-config/history`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => { loadFarm(); }, [loadFarm]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const weightSum = draftWeights ? FACTOR_ORDER.reduce((acc, k) => acc + Number(draftWeights[k] || 0), 0) : 0;
  const handleWeightChange = (key) => (val) => setDraftWeights((prev) => ({ ...prev, [key]: val }));

  const handleSaveWeights = async (e) => {
    e.preventDefault();
    setSaveError(null);
    if (Math.round(weightSum) !== 100) {
      setSaveError(`Weights must sum to 100 (currently ${weightSum}).`);
      return;
    }
    if (!reason.trim()) {
      setSaveError('A reason is required — this becomes a permanent, attributed record.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/mri-config`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights: draftWeights, alertThreshold: farmData?.alertThreshold, reason: reason.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Save failed');
      setReason('');
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      loadFarm();
      loadHistory();
    } catch (err) {
      setSaveError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const subIndexes = farmData?.subIndexes || [];
  const compositeScore = farmData?.compositeScore ?? 0;
  const alertThreshold = farmData?.alertThreshold ?? 40;
  const gaugeSubIndexes = subIndexes.map((s) => ({
    name: FACTOR_META[s.key]?.label || s.key,
    pct: s.value,
    color: FACTOR_META[s.key]?.color,
  }));

  return (
    <>
      <div className="card">
        <div className="card-title">Farm-Specific Sub-Index Readings</div>
        <p style={{ fontSize: '12.5px', color: 'var(--gray-dark)', lineHeight: 1.5, marginBottom: 14 }}>
          Vaccination and antibiotic compliance must be scientist-approved before MRI is updated — upload evidence on the Documents page to update them.
        </p>
        <label className="register-field" style={{ maxWidth: 320, marginBottom: 14 }}>
          <span>Farm</span>
          <select value={farmName} onChange={(e) => { setFarmName(e.target.value); }}>
            {herds.map((h) => (
              <option key={h.id} value={h.farm}>{h.farm}</option>
            ))}
          </select>
        </label>

        {loading || !farmData ? (
          <div style={{ color: 'var(--gray)', fontSize: 13 }}>Loading…</div>
        ) : (
          <div className="mid-row">
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {subIndexes.map((s) => (
                <div key={s.key} className="config-field">
                  <div className="config-field-header">
                    <span className="subindex-name">{FACTOR_META[s.key]?.label || s.key}</span>
                    <span className="subindex-pct" style={{ color: FACTOR_META[s.key]?.color }}>{s.value}%</span>
                  </div>
                  <div className="subindex-bar-track">
                    <div className="subindex-bar-fill" style={{ width: `${s.value}%`, background: FACTOR_META[s.key]?.color }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                    {s.source
                      ? `Sourced from "${s.source.originalName}", uploaded ${new Date(s.source.uploadedAt).toLocaleDateString()}${s.source.rationale ? ` — ${s.source.rationale}` : ''}`
                      : DOCUMENT_SOURCED_KEYS.has(s.key)
                        ? 'No scientist-approved document on file yet — showing registry default'
                        : 'Regional data, derived from the farm registry — not editable per document'}
                  </p>
                </div>
              ))}
            </div>
            <BiosecurityGauge score={compositeScore} statusLabel={statusLabelFor(compositeScore, alertThreshold)} subIndexes={gaugeSubIndexes} />
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Scoring Methodology</div>
        <p style={{ fontSize: '12.5px', color: 'var(--gray-dark)', lineHeight: 1.5, marginBottom: 14 }}>
          These weights apply corridor-wide, not per farm — changing them is a governance decision,
          so every change requires a written reason and is kept in a permanent, attributed history below.
        </p>
        {draftWeights && farmData && (
          <form onSubmit={handleSaveWeights} className="config-panel">
            {FACTOR_ORDER.map((key) => (
              <MRIWeightSlider
                key={key}
                label={FACTOR_META[key].label}
                value={draftWeights[key]}
                onChange={handleWeightChange(key)}
                color={FACTOR_META[key].color}
                weightPct={farmData.weights[key]}
              />
            ))}
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: weightSum === 100 ? 'var(--gray)' : 'var(--red)' }}>
              Total: {weightSum} / 100
            </div>

            <label className="register-field">
              <span>Reason for this change</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Realigning weights after Q1 audit review"
              />
            </label>

            {saveError && <div className="investigate-error">{saveError}</div>}

            <div className="config-actions">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save methodology'}</button>
              {savedAt && <span className="config-status-msg">Saved at {savedAt}</span>}
            </div>
          </form>
        )}
      </div>

      <div className="inspector-table-card">
        <div className="panel-header">
          <span className="card-title" style={{ marginBottom: 0 }}>Methodology history</span>
        </div>
        {history.length === 0 ? (
          <div style={{ padding: '14px 4px', color: 'var(--gray)', fontSize: '13px' }}>
            No changes recorded yet — showing default weights.
          </div>
        ) : (
          <table className="inspector-table">
            <thead>
              <tr><th>Date</th><th>Changed by</th><th>Weights</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)' }}>
                    {new Date(h.createdAt).toLocaleDateString()}
                  </td>
                  <td>{h.changedByName}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {FACTOR_ORDER.map((k) => `${k}:${h.weights[k]}`).join(' · ')}
                  </td>
                  <td style={{ color: 'var(--gray-dark)', fontSize: 12 }}>{h.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
