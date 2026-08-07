import React, { useState } from 'react';
import { timeAgo } from '../utils/timeAgo';
import { API_BASE } from '../apiBase';

const STATUS_META = {
  active: { cls: 'PASS', label: 'Active' },
  pending_review: { cls: 'REVIEW', label: 'Pending staff review' },
  rejected: { cls: 'FAIL', label: 'Rejected' },
};

export default function RegisteredFarmersTable({ farmers, onRemoved }) {
  const [removingId, setRemovingId] = useState(null);

  const handleRemove = async (farmer) => {
    if (!window.confirm(`Remove ${farmer.name}'s registration for ${farmer.farmName}? This can't be undone.`)) {
      return;
    }
    setRemovingId(farmer.id);
    try {
      const res = await fetch(`${API_BASE}/api/farmers/${farmer.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to remove registration');
      }
      onRemoved?.();
    } catch (err) {
      alert(err.message || 'Failed to remove registration');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="inspector-table-card">
      <div className="panel-header">
        <span className="card-title" style={{ marginBottom: 0 }}>Registered Farmers</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray)' }}>
          {farmers.length} registered
        </span>
      </div>

      {farmers.length === 0 ? (
        <div style={{ padding: '14px 4px', color: 'var(--gray)', fontSize: '13px' }}>
          No farmers registered yet.
        </div>
      ) : (
        <table className="inspector-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Farm</th>
              <th>Status</th>
              <th>Last Reminder</th>
              <th>Last Weekly Report</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {farmers.map((f) => {
              const meta = STATUS_META[f.status] || { cls: 'REVIEW', label: f.status };
              return (
                <tr key={f.id}>
                  <td style={{ fontWeight: 500 }}>{f.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-dark)' }}>{f.email}</td>
                  <td>{f.farmName}</td>
                  <td><span className={`status-tag ${meta.cls}`}>{meta.label}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>
                    {f.lastReminderSentAt ? timeAgo(f.lastReminderSentAt) : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>
                    {f.lastWeeklyReportSentAt ? timeAgo(f.lastWeeklyReportSentAt) : '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemove(f)}
                      disabled={removingId === f.id}
                    >
                      {removingId === f.id ? 'Removing…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
