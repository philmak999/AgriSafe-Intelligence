import { pool } from './db/pool.js';

function toRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmName: row.farm_name,
    status: row.status,
    riskLevel: row.risk_level,
    sourceReason: row.source_reason,
    investigation: row.investigation,
    notification: row.notification,
    lastReviewedAt: row.last_reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getRecords() {
  const { rows } = await pool.query('SELECT * FROM automation_records ORDER BY updated_at DESC');
  const records = rows.map(toRecord);

  const { rows: historyRows } = await pool.query(
    'SELECT record_id, at, event, detail FROM automation_history ORDER BY at ASC'
  );
  const historyByRecord = new Map();
  for (const h of historyRows) {
    if (!historyByRecord.has(h.record_id)) historyByRecord.set(h.record_id, []);
    historyByRecord.get(h.record_id).push({ at: h.at, event: h.event, detail: h.detail });
  }

  for (const record of records) {
    record.history = historyByRecord.get(record.id) || [];
  }
  return records;
}

export async function getRecordByFarm(farmName) {
  const { rows } = await pool.query('SELECT * FROM automation_records WHERE farm_name = $1', [farmName]);
  return toRecord(rows[0]);
}

const PATCH_COLUMNS = {
  status: 'status',
  riskLevel: 'risk_level',
  sourceReason: 'source_reason',
  investigation: 'investigation',
  notification: 'notification',
  lastReviewedAt: 'last_reviewed_at',
};

export async function upsertRecord(farmName, patch) {
  const entries = Object.entries(patch).filter(([key]) => key in PATCH_COLUMNS);
  const columns = entries.map(([key]) => PATCH_COLUMNS[key]);
  const values = entries.map(([, value]) => value);

  const id = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const insertColumns = ['id', 'farm_name', ...columns];
  const insertPlaceholders = insertColumns.map((_, i) => `$${i + 1}`);
  const updateClauses = columns.map((col) => `${col} = EXCLUDED.${col}`);

  const { rows } = await pool.query(
    `INSERT INTO automation_records (${insertColumns.join(', ')})
     VALUES (${insertPlaceholders.join(', ')})
     ON CONFLICT (farm_name) DO UPDATE
     SET ${updateClauses.length ? updateClauses.join(', ') + ',' : ''} updated_at = now()
     RETURNING *`,
    [id, farmName, ...values]
  );
  return toRecord(rows[0]);
}

export async function addHistory(farmName, event, detail) {
  const record = await getRecordByFarm(farmName);
  if (!record) return;
  await pool.query('INSERT INTO automation_history (record_id, event, detail) VALUES ($1, $2, $3)', [
    record.id,
    event,
    detail,
  ]);
  await pool.query('UPDATE automation_records SET updated_at = now() WHERE id = $1', [record.id]);
}

export async function addRun(summary) {
  await pool.query(
    `INSERT INTO automation_runs (sourced, processed, notified, failed, duration_ms)
     VALUES ($1, $2, $3, $4, $5)`,
    [summary.sourced || 0, summary.processed || 0, summary.notified || 0, summary.failed || 0, summary.durationMs || null]
  );
  // Keep only the 50 most recent runs, same retention as the old JSON store.
  await pool.query(`
    DELETE FROM automation_runs
    WHERE id NOT IN (SELECT id FROM automation_runs ORDER BY at DESC LIMIT 50)
  `);
}

function toRun(row) {
  return {
    at: row.at,
    sourced: row.sourced,
    processed: row.processed,
    notified: row.notified,
    failed: row.failed,
    durationMs: row.duration_ms,
  };
}

export async function getReport() {
  const { rows: records } = await pool.query('SELECT status, risk_level FROM automation_records');

  const byStatus = {};
  const byRisk = {};
  for (const r of records) {
    if (r.status) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    if (r.risk_level) byRisk[r.risk_level] = (byRisk[r.risk_level] || 0) + 1;
  }

  const { rows: runRows } = await pool.query('SELECT * FROM automation_runs ORDER BY at DESC LIMIT 50');
  const runs = runRows.map(toRun);

  return {
    totalTracked: records.length,
    byStatus,
    byRisk,
    lastRun: runs[0] || null,
    runs,
  };
}
