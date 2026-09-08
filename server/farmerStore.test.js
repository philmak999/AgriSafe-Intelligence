import { describe, it, expect, afterAll } from 'vitest';
import { pool } from './db/pool.js';
import {
  getFarmerById,
  getFarmerByFarm,
  getFarmerByUsername,
  isFarmClaimed,
  isUsernameTaken,
  createFarmer,
  approveFarmer,
  rejectFarmer,
  updateFarmer,
  deleteFarmer,
} from './farmerStore.js';

const unique = () => `test_farmer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

afterAll(async () => {
  await pool.query("DELETE FROM farmers WHERE username LIKE 'test_farmer_%'");
  await pool.end();
});

function makeFarmer(overrides = {}) {
  const username = unique();
  return createFarmer({
    username,
    password: 'hunter22',
    name: 'Test Farmer',
    email: 'farmer@example.com',
    farmName: `Farm ${username}`,
    farmId: 'TEST-0001',
    documentPath: 'uploads/fake-key.pdf',
    documentOriginalName: 'deed.pdf',
    ...overrides,
  });
}

describe('farmerStore', () => {
  it('creates a farmer as pending_review with default preferences', async () => {
    const farmer = await makeFarmer();
    expect(farmer.status).toBe('pending_review');
    expect(farmer.preferences).toEqual({ reminders: true, weeklyReport: true });
    expect(farmer.passwordHash).not.toBe('hunter22');
  });

  it('reports a farm as claimed only while pending or active, not after rejection', async () => {
    const farmer = await makeFarmer();
    expect(await isFarmClaimed(farmer.farmName)).toBe(true);

    await rejectFarmer(farmer.id, 'Document unreadable');
    expect(await isFarmClaimed(farmer.farmName)).toBe(false);
  });

  it('approve/reject round-trip updates status and review fields', async () => {
    const farmer = await makeFarmer();
    const approved = await approveFarmer(farmer.id);
    expect(approved.status).toBe('active');
    expect(approved.reviewedAt).not.toBeNull();

    const found = await getFarmerByFarm(farmer.farmName);
    expect(found.status).toBe('active');
  });

  it('looks up by id and by username (case-insensitive)', async () => {
    const farmer = await makeFarmer();
    expect((await getFarmerById(farmer.id)).id).toBe(farmer.id);
    expect((await getFarmerByUsername(farmer.username.toUpperCase())).id).toBe(farmer.id);
  });

  it('rejects a duplicate username', async () => {
    const farmer = await makeFarmer();
    expect(await isUsernameTaken(farmer.username)).toBe(true);
    expect(await isUsernameTaken(unique())).toBe(false);
  });

  it('updateFarmer patches only the given fields', async () => {
    const farmer = await makeFarmer();
    const updated = await updateFarmer(farmer.id, { preferences: { reminders: false, weeklyReport: true } });
    expect(updated.preferences).toEqual({ reminders: false, weeklyReport: true });
    expect(updated.name).toBe(farmer.name);
  });

  it('deleteFarmer removes the row and frees the farm', async () => {
    const farmer = await makeFarmer();
    expect(await deleteFarmer(farmer.id)).toBe(true);
    expect(await getFarmerById(farmer.id)).toBeNull();
    expect(await deleteFarmer(farmer.id)).toBe(false);
  });
});
