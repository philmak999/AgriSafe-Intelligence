import bcrypt from 'bcryptjs';
import { pool } from './db/pool.js';

function toFarmer(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    name: row.name,
    email: row.email,
    farmName: row.farm_name,
    farmId: row.farm_id,
    role: row.role,
    status: row.status,
    documentPath: row.document_path,
    documentOriginalName: row.document_original_name,
    preferences: row.preferences,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    lastReminderSentAt: row.last_reminder_sent_at,
    lastWeeklyReportSentAt: row.last_weekly_report_sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllFarmers() {
  const { rows } = await pool.query('SELECT * FROM farmers ORDER BY created_at DESC');
  return rows.map(toFarmer);
}

export async function getPendingFarmers() {
  const { rows } = await pool.query(
    "SELECT * FROM farmers WHERE status = 'pending_review' ORDER BY created_at DESC"
  );
  return rows.map(toFarmer);
}

export async function getActiveFarmers() {
  const { rows } = await pool.query("SELECT * FROM farmers WHERE status = 'active'");
  return rows.map(toFarmer);
}

export async function getFarmerById(id) {
  const { rows } = await pool.query('SELECT * FROM farmers WHERE id = $1', [id]);
  return toFarmer(rows[0]);
}

export async function getFarmerByFarm(farmName) {
  const { rows } = await pool.query('SELECT * FROM farmers WHERE farm_name = $1', [farmName]);
  return toFarmer(rows[0]);
}

export async function getFarmerByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM farmers WHERE LOWER(username) = LOWER($1)', [username]);
  return toFarmer(rows[0]);
}

// A farm is "claimed" if there's a registration for it that's active or
// still awaiting staff review, so a second signup can't race an approval.
export async function isFarmClaimed(farmName) {
  const { rows } = await pool.query(
    "SELECT 1 FROM farmers WHERE farm_name = $1 AND status IN ('active', 'pending_review') LIMIT 1",
    [farmName]
  );
  return rows.length > 0;
}

export async function isUsernameTaken(username) {
  const { rows } = await pool.query('SELECT 1 FROM farmers WHERE LOWER(username) = LOWER($1) LIMIT 1', [
    username,
  ]);
  return rows.length > 0;
}

export async function createFarmer({ username, password, name, email, farmName, farmId, documentPath, documentOriginalName }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const id = `farmer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { rows } = await pool.query(
    `INSERT INTO farmers (id, username, password_hash, name, email, farm_name, farm_id, document_path, document_original_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [id, username, passwordHash, name, email, farmName, farmId, documentPath, documentOriginalName]
  );

  return toFarmer(rows[0]);
}

export async function approveFarmer(id) {
  const { rows } = await pool.query(
    `UPDATE farmers
     SET status = 'active', reviewed_at = now(), review_note = NULL, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return toFarmer(rows[0]);
}

export async function rejectFarmer(id, reason) {
  const { rows } = await pool.query(
    `UPDATE farmers
     SET status = 'rejected', reviewed_at = now(), review_note = $2, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, reason || null]
  );
  return toFarmer(rows[0]);
}

const PATCH_COLUMNS = {
  status: 'status',
  documentPath: 'document_path',
  documentOriginalName: 'document_original_name',
  preferences: 'preferences',
  reviewedAt: 'reviewed_at',
  reviewNote: 'review_note',
  lastReminderSentAt: 'last_reminder_sent_at',
  lastWeeklyReportSentAt: 'last_weekly_report_sent_at',
};

export async function updateFarmer(id, patch) {
  const entries = Object.entries(patch).filter(([key]) => key in PATCH_COLUMNS);
  if (entries.length === 0) return getFarmerById(id);

  const setClauses = entries.map(([key], i) => `${PATCH_COLUMNS[key]} = $${i + 2}`);
  const values = entries.map(([, value]) => value);

  const { rows } = await pool.query(
    `UPDATE farmers SET ${setClauses.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return toFarmer(rows[0]);
}

export async function deleteFarmer(id) {
  const { rowCount } = await pool.query('DELETE FROM farmers WHERE id = $1', [id]);
  return rowCount > 0;
}
