import React, { useCallback, useEffect, useState } from 'react';
import AutomationSummary from '../components/AutomationSummary';
import AutomationRecordsTable from '../components/AutomationRecordsTable';
import AutomationRunsList from '../components/AutomationRunsList';

const POLL_MS = 8000;

export default function Automation() {
  const [records, setRecords] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [recordsRes, reportRes] = await Promise.all([
        fetch('/api/automation/records', { credentials: 'include' }),
        fetch('/api/automation/report', { credentials: 'include' }),
      ]);
      if (!recordsRes.ok || !reportRes.ok) throw new Error('Failed to load automation data');
      setRecords(await recordsRes.json());
      setReport(await reportRes.json());
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load automation data');
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const runNow = async () => {
    setRunning(true);
    try {
      await fetch('/api/automation/run-now', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      await refresh();
    } catch {
      setError('Failed to trigger a cycle');
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <div className="panel-header" style={{ marginBottom: 0 }}>
        <span className="card-title" style={{ marginBottom: 0 }}>
          Autonomous loop — sources risk data, investigates, emails follow-ups, and tracks results on its own
        </span>
        <button type="button" className="btn-primary" onClick={runNow} disabled={running}>
          {running ? 'Running…' : 'Run cycle now'}
        </button>
      </div>

      {error && (
        <div className="investigate-error">
          {error}
          <div className="investigate-error-hint">
            Check that the API server is running (<code>npm run dev</code>).
          </div>
        </div>
      )}

      <AutomationSummary report={report} />

      <div className="mid-row">
        <AutomationRecordsTable records={records} />
        <AutomationRunsList runs={report?.runs || []} />
      </div>
    </>
  );
}
