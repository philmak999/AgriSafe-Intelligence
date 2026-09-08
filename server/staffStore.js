import bcrypt from 'bcryptjs';
import { pool } from './db/pool.js';

function toStaff(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  };
}

export async function getStaffByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM staff WHERE LOWER(username) = LOWER($1)', [username]);
  return toStaff(rows[0]);
}

export async function createStaffAccount({ username, password, name }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const id = `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { rows } = await pool.query(
    `INSERT INTO staff (id, username, password_hash, name)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, username, passwordHash, name]
  );

  return toStaff(rows[0]);
}
