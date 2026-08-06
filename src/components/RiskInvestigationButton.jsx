import React, { useState } from 'react';

const TOOL_LABELS = {
  get_herd_record: 'Herd registry lookup',
  get_risk_timeline: 'Risk timeline scan',
  get_inspection_history: 'Inspection history lookup',
  get_compliance_status: 'Compliance filing lookup',
};

export default function RiskInvestigationButton({ farmName }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const runInvestigation = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message || 'Investigation failed');
    } finally {
      setLoading(false);
    }
  };

  const report = result?.report;
  const hasStructuredReport = report && (report.summary || report.findings?.length || report.recommendation);

  return (
    <>
      <button
        type="button"
        className="investigate-btn"
        onClick={(e) => {
          e.stopPropagation();
          runInvestigation();
        }}
      >
        Investigate →
      </button>

      {open && (
        <div className="investigate-overlay" onClick={() => setOpen(false)}>
          <div className="investigate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="investigate-header">
              <div>
                <div className="investigate-title">Risk Investigation Agent</div>
                <div className="investigate-subject">{farmName}</div>
              </div>
              <div className="investigate-header-actions">
                {result?.riskLevel && (
                  <span className={`risk-badge ${result.riskLevel}`}>{result.riskLevel}</span>
                )}
                <button type="button" className="investigate-close" onClick={() => setOpen(false)}>
                  ✕
                </button>
              </div>
            </div>

            {loading && (
              <div className="investigate-loading">
                <span className="investigate-spinner" />
                Gathering herd, inspection, timeline & compliance data…
              </div>
            )}

            {error && (
              <div className="investigate-error">
                {error}
                <div className="investigate-error-hint">
                  Check that the API server is running (<code>npm run dev</code>) and that{' '}
                  <code>GROQ_API_KEY</code> is set in <code>.env</code>.
                </div>
              </div>
            )}

            {result && (
              <>
                {result.steps?.length > 0 && (
                  <div className="investigate-section">
                    <div className="investigate-section-label">Investigation trace</div>
                    <div className="investigate-steps">
                      {result.steps.map((step, i) => (
                        <div className="investigate-step" key={i}>
                          <span className="investigate-step-index">{i + 1}</span>
                          <div>
                            <div className="investigate-step-tool">
                              {TOOL_LABELS[step.tool] || step.tool}
                            </div>
                            <div className="investigate-step-args">
                              {Object.values(step.args || {}).join(' · ')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasStructuredReport ? (
                  <>
                    {report.summary && (
                      <div className="investigate-section">
                        <div className="investigate-section-label">Summary</div>
                        <p className="investigate-summary-text">{report.summary}</p>
                      </div>
                    )}

                    {report.findings?.length > 0 && (
                      <div className="investigate-section">
                        <div className="investigate-section-label">Findings</div>
                        <ul className="investigate-findings-list">
                          {report.findings.map((finding, i) => (
                            <li className="investigate-finding-item" key={i}>
                              <span className="investigate-finding-dot" />
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {report.recommendation && (
                      <div className={`investigate-recommendation ${result.riskLevel || ''}`}>
                        <div className="investigate-section-label">Recommendation</div>
                        {report.recommendation}
                      </div>
                    )}
                  </>
                ) : (
                  report?.summary && <div className="investigate-report">{report.summary}</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
