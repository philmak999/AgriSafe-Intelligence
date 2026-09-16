import { pool } from './db/pool.js';

export const DEFAULT_WEIGHTS = { vaccination: 35, antibiotic: 30, herdDensity: 20, outbreakProximity: 15 };
export const DEFAULT_ALERT_THRESHOLD = 40;

function toConfig(row) {
  if (!row) return null;
  return {
    id: row.id,
    weights: row.weights,
    alertThreshold: row.alert_threshold,
    changedById: row.changed_by_id,
    changedByName: row.changed_by_name,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

// No row yet (fresh DB) falls back to the same defaults the old hardcoded
// FACTORS array in MRIModelConfig.jsx used, so the page never renders blank.
export async function getActiveConfig() {
  const { rows } = await pool.query('SELECT * FROM mri_config ORDER BY created_at DESC LIMIT 1');
  if (rows[0]) return toConfig(rows[0]);
  return { id: null, weights: DEFAULT_WEIGHTS, alertThreshold: DEFAULT_ALERT_THRESHOLD, changedById: null, changedByName: null, reason: null, createdAt: null };
}

export async function saveConfig({ weights, alertThreshold, changedById, changedByName, reason }) {
  const { rows } = await pool.query(
    `INSERT INTO mri_config (weights, alert_threshold, changed_by_id, changed_by_name, reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [JSON.stringify(weights), alertThreshold, changedById, changedByName, reason]
  );
  return toConfig(rows[0]);
}

export async function getConfigHistory(limit = 20) {
  const { rows } = await pool.query('SELECT * FROM mri_config ORDER BY created_at DESC LIMIT $1', [limit]);
  return rows.map(toConfig);
}
