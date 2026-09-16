import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { API_BASE } from '../apiBase';

// Farmers don't get a cross-farm feed — this is for the roles that need to
// know the moment new evidence comes in. Loads recent history on mount, then
// stays open via SSE so a farmer's upload or an inspector's submission
// appears live, without a refresh.
export default function ActivityFeed() {
  const { user } = useAuth();
  const canSee = user?.role === 'scientist' || user?.role === 'inspector';
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(0);

  useEffect(() => {
    if (!canSee) return undefined;

    fetch(`${API_BASE}/api/activity`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});

    const es = new EventSource(`${API_BASE}/api/activity/stream`, { withCredentials: true });
    es.onmessage = (e) => {
      try {
        const activity = JSON.parse(e.data);
        setItems((prev) => [activity, ...prev].slice(0, 30));
        setUnseen((n) => n + 1);
      } catch {
        // comment/heartbeat lines don't reach onmessage; ignore anything else unparsable
      }
    };

    return () => es.close();
  }, [canSee]);

  if (!canSee) return null;

  const toggle = () => {
    setOpen((o) => !o);
    if (!open) setUnseen(0);
  };

  return (
    <div className="activity-feed">
      <button type="button" className="activity-bell" onClick={toggle} aria-label="Live activity feed">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6.5a4 4 0 0 1 8 0c0 3 1 4 1 4H3s1-1 1-4Z" />
          <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" />
        </svg>
        {unseen > 0 && <span className="activity-badge">{unseen}</span>}
      </button>

      {open && (
        <div className="activity-dropdown">
          <div className="activity-dropdown-title">Live activity</div>
          {items.length === 0 ? (
            <div className="activity-empty">Nothing yet.</div>
          ) : (
            items.map((a) => (
              <div key={a.id} className="activity-item">
                <div className="activity-summary">{a.summary}</div>
                <div className="activity-time">
                  {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
