import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { API_BASE } from '../apiBase';
import { herds } from '../data/mockData';

const CATEGORY_LABELS = {
  vaccination_certificate: 'Vaccination certificate',
  lab_result: 'Lab result',
  compliance_filing: 'Compliance filing',
  inspection_evidence: 'Inspection evidence',
  other: 'Other',
};

// Categories a person picks when uploading directly here. inspection_evidence
// is attached automatically from the Inspections checklist flow instead, so
// it isn't offered as a manual choice.
const UPLOADABLE_CATEGORIES = Object.entries(CATEGORY_LABELS).filter(([key]) => key !== 'inspection_evidence');

export default function Documents() {
  const { user } = useAuth();
  const isStaff = user?.role === 'scientist' || user?.role === 'inspector';

  const [farmName, setFarmName] = useState(user?.role === 'farmer' ? user.farmName : '');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ category: 'vaccination_certificate', note: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    const qs = isStaff && farmName ? `?farmName=${encodeURIComponent(farmName)}` : '';
    setLoading(true);
    fetch(`${API_BASE}/api/documents${qs}`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [isStaff, farmName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    if (isStaff && !farmName) {
      setError('Choose a farm first.');
      return;
    }

    const body = new FormData();
    body.append('category', form.category);
    body.append('note', form.note);
    if (isStaff) body.append('farmName', farmName);
    body.append('file', file);

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/documents`, { method: 'POST', credentials: 'include', body });
      const responseBody = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseBody.error || 'Upload failed');
      setForm({ category: 'vaccination_certificate', note: '' });
      setFile(null);
      e.target.reset();
      refresh();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const decideSuggestion = async (doc, action) => {
    await fetch(`${API_BASE}/api/documents/${doc.id}/${action}-suggestion`, { method: 'POST', credentials: 'include' });
    refresh();
  };

  return (
    <>
      <div className="card" style={{ maxWidth: 520 }}>
        <div className="card-title">Upload a document</div>
        <p style={{ fontSize: '12.5px', color: 'var(--gray-dark)', lineHeight: 1.5, marginBottom: 14 }}>
          Vaccination certificates and lab results are read automatically and, when the document
          supports it, the AI proposes an updated MRI sub-index value for a scientist to review —
          it’s never applied without sign-off.
        </p>
        <form onSubmit={handleUpload} className="register-form">
          {isStaff && (
            <label className="register-field">
              <span>Farm</span>
              <select required value={farmName} onChange={(e) => setFarmName(e.target.value)}>
                <option value="" disabled>Select a farm…</option>
                {herds.map((h) => (
                  <option key={h.id} value={h.farm}>{h.farm}</option>
                ))}
              </select>
            </label>
          )}

          <label className="register-field">
            <span>Category</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {UPLOADABLE_CATEGORIES.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>

          <label className="register-field">
            <span>Note (optional)</span>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="e.g. BVD vaccination, administered Aug 2"
            />
          </label>

          <label className="register-field">
            <span>File (PDF, PNG, JPG, or WEBP)</span>
            <input
              required
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {error && <div className="investigate-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 4 }}>
            {submitting ? 'Uploading & processing…' : 'Upload'}
          </button>
        </form>
      </div>

      <div className="inspector-table-card">
        <div className="panel-header">
          <span className="card-title" style={{ marginBottom: 0 }}>
            {isStaff ? (farmName ? `Documents — ${farmName}` : 'All Documents') : 'Your Documents'}
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

        {loading ? (
          <div style={{ padding: '14px 4px', color: 'var(--gray)', fontSize: '13px' }}>Loading…</div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '14px 4px', color: 'var(--gray)', fontSize: '13px' }}>No documents uploaded yet.</div>
        ) : (
          <table className="inspector-table">
            <thead>
              <tr>
                <th>Farm</th>
                <th>Category</th>
                <th>Uploaded by</th>
                <th>Date</th>
                <th>AI summary</th>
                <th>File</th>
                {user?.role === 'scientist' && <th>Suggestion</th>}
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>{d.farmName}</td>
                  <td>{CATEGORY_LABELS[d.category] || d.category}</td>
                  <td style={{ color: 'var(--gray-dark)' }}>
                    {d.uploadedByName} <span style={{ color: 'var(--gray)', fontSize: 11 }}>({d.uploadedByRole})</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)' }}>
                    {new Date(d.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--gray-dark)', maxWidth: 260 }}>
                    {d.aiSummary || d.note || '—'}
                  </td>
                  <td>
                    <a href={`${API_BASE}/api/documents/${d.id}/file`} target="_blank" rel="noreferrer" className="doc-link">
                      {d.originalName}
                    </a>
                  </td>
                  {user?.role === 'scientist' && (
                    <td>
                      {d.suggestionStatus === 'pending' && d.suggestedSubindexKey ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                            {d.suggestedSubindexKey} → {d.suggestedSubindexValue}
                          </span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" className="approve-btn" onClick={() => decideSuggestion(d, 'apply')}>Approve</button>
                            <button type="button" className="remove-btn" onClick={() => decideSuggestion(d, 'dismiss')}>Dismiss</button>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                          {d.suggestedSubindexKey ? d.suggestionStatus : '—'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
