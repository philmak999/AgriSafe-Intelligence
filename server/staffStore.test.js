import { describe, it, expect, afterAll } from 'vitest';
import { pool } from './db/pool.js';
import { getStaffByUsername, createStaffAccount } from './staffStore.js';

const unique = () => `test_staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

afterAll(async () => {
  await pool.query("DELETE FROM staff WHERE username LIKE 'test_staff_%'");
  await pool.end();
});

describe('staffStore', () => {
  it('creates a staff account with a hashed password', async () => {
    const username = unique();
    const staff = await createStaffAccount({ username, password: 'hunter22', name: 'Test Scientist' });

    expect(staff.username).toBe(username);
    expect(staff.name).toBe('Test Scientist');
    expect(staff.role).toBe('scientist');
    expect(staff.passwordHash).not.toBe('hunter22');
  });

  it('looks up a staff account case-insensitively', async () => {
    const username = unique();
    await createStaffAccount({ username, password: 'hunter22', name: 'Test Scientist' });

    const found = await getStaffByUsername(username.toUpperCase());
    expect(found).not.toBeNull();
    expect(found.username).toBe(username);
  });

  it('returns null for an unknown username', async () => {
    const found = await getStaffByUsername(unique());
    expect(found).toBeNull();
  });
});
