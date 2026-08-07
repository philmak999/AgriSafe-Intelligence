import React, { useCallback, useEffect, useState } from 'react';
import PendingApprovalsTable from '../components/PendingApprovalsTable';
import RegisteredFarmersTable from '../components/RegisteredFarmersTable';
import { API_BASE } from '../apiBase';

export default function FarmerApprovals() {
  const [pending, setPending] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [running, setRunning] = useState(false);

  const refresh = useCallback(() => {
    fetch(`${API_BASE}/api/farmers/pending`, { credentials: 'include' }).then((r) => r.json()).then(setPending).catch(() => {});
    fetch(`${API_BASE}/api/farmers`, { credentials: 'include' }).then((r) => r.json()).then(setFarmers).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  const runNow = async () => {
    setRunning(true);
    try {
      await fetch(`${API_BASE}/api/farmer-loop/run-now`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      refresh();
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <PendingApprovalsTable pending={pending} onDecided={refresh} />

      <div className="panel-header" style={{ marginBottom: 0 }}>
        <span className="card-title" style={{ marginBottom: 0 }}>
          Farmer notification loop — reminders & weekly reports run on their own daily
        </span>
        <button type="button" className="btn-primary" onClick={runNow} disabled={running}>
          {running ? 'Running…' : 'Run now'}
        </button>
      </div>

      <RegisteredFarmersTable farmers={farmers} onRemoved={refresh} />
    </>
  );
}
