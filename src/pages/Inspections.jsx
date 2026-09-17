import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { API_BASE } from '../apiBase';
import { herds } from '../data/mockData';

const RESULT_OPTIONS = ['pass', 'fail', 'na'];

function emptyChecklistFrom(items) {
  return items.map((item) => ({ key: item.key, label: item.label, result: 'pass', note: '', correctiveAction: '', dueDate: '' }));
}

function InspectionForm({ farmName, checklistItems, onSubmitted }) {
  const [checklist, setChecklist] = useState(() => emptyChecklistFrom(checklistItems));
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setChecklist(emptyChecklistFrom(checklistItems));
  }, [checklistItems, farmName]);

  const updateItem = (key, patch) => {
    setChecklist((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const correctiveActions = checklist
      .filter((c) => c.result === 'fail' && c.correctiveAction.trim())
      .map((c) => ({ item: c.key, action: c.correctiveAction.trim(), dueDate: c.dueDate || null, resolved: false }));

    const body = new FormData();
    body.append('farmName', farmName);
    body.append('checklist', JSON.stringify(checklist.map(({ key, label, result, note }) => ({ key, label, result, note }))));
    body.append('correctiveActions', JSON.stringify(correctiveActions));
    files.forEach((f) => body.append('evidence', f));

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/inspections`, { method: 'POST', credentials: 'include', body });
      const responseBody = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseBody.error || 'Submission failed');
      setChecklist(emptyChecklistFrom(checklistItems));
      setFiles([]);
      e.target.reset();
      onSubmitted?.();
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      {checklist.map((item) => (
        <div key={item.key} className="config-field" style={{ borderBottom: 'var(--border-thin)', paddingBottom: 12 }}>
          <div className="config-field-header">
            <span className="subindex-name">{item.label}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {RESULT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={item.result === opt ? 'btn-primary' : 'remove-btn'}
                style={{ textTransform: 'uppercase', fontSize: 11, padding: '4px 10px' }}
                onClick={() => updateItem(item.key, { result: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
          <input
            placeholder="Note (optional)"
            value={item.note}
            onChange={(e) => updateItem(item.key, { note: e.target.value })}
            style={{ marginTop: 4 }}
          />
          {item.result === 'fail' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                placeholder="Corrective action required"
                value={item.correctiveAction}
                onChange={(e) => updateItem(item.key, { correctiveAction: e.target.value })}
                style={{ flex: 2 }}
              />
              <input
                type="date"
                value={item.dueDate}
                onChange={(e) => updateItem(item.key, { dueDate: e.target.value })}
                style={{ flex: 1 }}
              />
            </div>
          )}
        </div>
      ))}

      <label className="register-field">
        <span>Evidence photos (optional)</span>
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
      </label>

      {error && <div className="investigate-error">{error}</div>}

      <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 4 }}>
        {submitting ? 'Submitting…' : 'Submit inspection'}
      </button>
    </form>
  );
}

function InspectionList({ inspections, loading }) {
  if (loading) return <div style={{ padding: '14px 4px', color: 'var(--gray)', fontSize: '13px' }}>Loading…</div>;
  if (inspections.length === 0) {
    return <div style={{ padding: '14px 4px', color: 'var(--gray)', fontSize: '13px' }}>No inspections on file yet.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {inspections.map((insp) => (
        <div key={insp.id} className="card" style={{ margin: 0 }}>
          <div className="panel-header" style={{ marginBottom: 10 }}>
            <span className="card-title" style={{ marginBottom: 0 }}>
              {insp.farmName} · {new Date(insp.performedAt).toLocaleDateString()}
            </span>
            <span className={`status-tag ${insp.overallResult}`}>{insp.overallResult}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-dark)', marginBottom: 10 }}>
            Inspector: {insp.inspectorName} · {insp.passedCount}/{insp.passedCount + insp.failedCount} items passed
          </p>

          <table className="inspector-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Result</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {insp.checklist.map((item) => (
                <tr key={item.key}>
                  <td>{item.label}</td>
                  <td><span className={`status-tag ${item.result === 'pass' ? 'PASS' : item.result === 'fail' ? 'FAIL' : 'REVIEW'}`}>{item.result}</span></td>
                  <td style={{ color: 'var(--gray-dark)', fontSize: 12 }}>{item.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {insp.correctiveActions?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="subindex-name" style={{ marginBottom: 4 }}>Corrective actions</div>
              <ul style={{ fontSize: 12.5, color: 'var(--gray-dark)', paddingLeft: 18, lineHeight: 1.6 }}>
                {insp.correctiveActions.map((a, i) => (
                  <li key={i}>
                    {a.action} {a.dueDate ? `(due ${a.dueDate})` : ''} {a.resolved ? '(resolved)' : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Inspections() {
  const { user } = useAuth();
  const isInspector = user?.role === 'inspector';
  const isStaff = user?.role === 'scientist' || isInspector;

  const [farmName, setFarmName] = useState(user?.role === 'farmer' ? user.farmName : '');
  const [checklistItems, setChecklistItems] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/inspections/checklist-items`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setChecklistItems)
      .catch(() => setChecklistItems([]));
  }, []);

  const refresh = useCallback(() => {
    const qs = isStaff && farmName ? `?farmName=${encodeURIComponent(farmName)}` : '';
    setLoading(true);
    fetch(`${API_BASE}/api/inspections${qs}`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setInspections)
      .catch(() => setInspections([]))
      .finally(() => setLoading(false));
  }, [isStaff, farmName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <>
      {isInspector && (
        <div className="card">
          <div className="card-title">New inspection</div>
          <label className="register-field" style={{ marginBottom: 14 }}>
            <span>Farm</span>
            <select required value={farmName} onChange={(e) => setFarmName(e.target.value)}>
              <option value="" disabled>Select a farm…</option>
              {herds.map((h) => (
                <option key={h.id} value={h.farm}>{h.farm}</option>
              ))}
            </select>
          </label>
          {farmName && checklistItems.length > 0 && (
            <InspectionForm farmName={farmName} checklistItems={checklistItems} onSubmitted={refresh} />
          )}
        </div>
      )}

      <div className="inspector-table-card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <div className="panel-header">
          <span className="card-title" style={{ marginBottom: 0 }}>
            {isStaff ? (farmName ? `Inspections — ${farmName}` : 'All Inspections') : 'Your Inspection Results'}
          </span>
          {isStaff && (
            <select value={farmName} onChange={(e) => setFarmName(e.target.value)} style={{ fontSize: 12 }}>
              <option value="">All farms</option>
              {herds.map((h) => (
                <option key={h.id} value={h.farm}>{h.farm}</option>
              ))}
            </select>
          )}
        </div>
        <InspectionList inspections={inspections} loading={loading} />
      </div>
    </>
  );
}
