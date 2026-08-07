import React, { useState } from 'react';
import { API_BASE } from '../apiBase';

export default function PendingApprovalsTable({ pending, onDecided }) {
  const [busyId, setBusyId] = useState(null);

  const approve = async (farmer) => {
    setBusyId(farmer.id);
    try {
      const res = await fetch(`${API_BASE}/api/farmers/${farmer.id}/approve`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Approve failed');
      }
      onDecided?.();
    } catch (err) {
      alert(err.message || 'Approve failed');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (farmer) => {
    const reason = window.prompt(`Reason for rejecting ${farmer.name}'s registration (optional):`, '');
    if (reason === null) return; // cancelled
    setBusyId(farmer.id);
    try {
      const res = await fetch(`${API_BASE}/api/farmers/${farmer.id}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Reject failed');
      }
      onDecided?.();
    } catch (err) {
      alert(err.message || 'Reject failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="inspector-table-card">
      <div className="panel-header">
        <span className="card-title" style={{ marginBottom: 0 }}>Pending Review</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)' }}>
          {pending.length} awaiting review
        </span>
      </div>

      {pending.length === 0 ? (
        <div style={{ padding: '14px 4px', color: 'var(--gray)', fontSize: '13px' }}>
          Nothing waiting on review.
        </div>
      ) : (
        <table className="inspector-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Farm</th>
              <th>Herd ID</th>
              <th>Document</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pending.map((f) => (
              <tr key={f.id}>
                <td style={{ fontWeight: 500 }}>{f.name}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-dark)' }}>{f.email}</td>
                <td>{f.farmName}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>{f.farmId}</td>
                <td>
                  <a href={`${API_BASE}/api/farmers/${f.id}/document`} target="_blank" rel="noreferrer" className="doc-link">
                    {f.documentOriginalName || 'View document'}
                  </a>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="approve-btn"
                    onClick={() => approve(f)}
                    disabled={busyId === f.id}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => reject(f)}
                    disabled={busyId === f.id}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
