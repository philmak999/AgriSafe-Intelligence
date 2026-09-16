import { pool } from './db/pool.js';
import { activityBus } from './activityBus.js';

function toActivity(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    farmName: row.farm_name,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    summary: row.summary,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

// Persists the event (so a page load / reconnect can catch up via
// getRecentActivity) and emits it for any open SSE connections to push live.
export async function logActivity({ type, farmName, actorName, actorRole, summary, detail }) {
  const { rows } = await pool.query(
    `INSERT INTO activity_log (type, farm_name, actor_name, actor_role, summary, detail)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [type, farmName || null, actorName || null, actorRole || null, summary, detail ? JSON.stringify(detail) : null]
  );
  const activity = toActivity(rows[0]);
  activityBus.emit('activity', activity);
  return activity;
}

export async function getRecentActivity(limit = 20) {
  const { rows } = await pool.query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT $1', [limit]);
  return rows.map(toActivity);
}
