import { describe, it, expect, afterAll } from 'vitest';
import { pool } from './db/pool.js';
import { getRecordByFarm, upsertRecord, addHistory, addRun, getReport } from './store.js';

const unique = () => `Test Farm ${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

afterAll(async () => {
  await pool.query("DELETE FROM automation_records WHERE farm_name LIKE 'Test Farm %'");
  await pool.end();
});

describe('automation store', () => {
  it('upsertRecord creates a new record, then patches only given fields on conflict', async () => {
    const farmName = unique();

    const created = await upsertRecord(farmName, { status: 'investigating', riskLevel: 'HIGH' });
    expect(created.status).toBe('investigating');
    expect(created.riskLevel).toBe('HIGH');

    const updated = await upsertRecord(farmName, { status: 'notified' });
    expect(updated.id).toBe(created.id); // same row, not a new one
    expect(updated.status).toBe('notified');
    expect(updated.riskLevel).toBe('HIGH'); // untouched field preserved

    const fetched = await getRecordByFarm(farmName);
    expect(fetched.status).toBe('notified');
  });

  it('addHistory appends events visible via getRecords, ordered oldest first', async () => {
    const farmName = unique();
    await upsertRecord(farmName, { status: 'investigating' });
    await addHistory(farmName, 'sourced', 'Risk flag detected');
    await addHistory(farmName, 'investigated', 'Investigation complete');

    const { getRecords } = await import('./store.js');
    const records = await getRecords();
    const record = records.find((r) => r.farmName === farmName);

    expect(record.history.map((h) => h.event)).toEqual(['sourced', 'investigated']);
  });

  it('getReport aggregates counts by status and risk level', async () => {
    const farmA = unique();
    const farmB = unique();
    await upsertRecord(farmA, { status: 'notified', riskLevel: 'HIGH' });
    await upsertRecord(farmB, { status: 'notified', riskLevel: 'MED' });

    const report = await getReport();
    expect(report.byStatus.notified).toBeGreaterThanOrEqual(2);
    expect(report.byRisk.HIGH).toBeGreaterThanOrEqual(1);
    expect(report.byRisk.MED).toBeGreaterThanOrEqual(1);
  });

  it('addRun records a run summary retrievable as lastRun', async () => {
    await addRun({ sourced: 3, processed: 2, notified: 1, failed: 1, durationMs: 1234 });
    const report = await getReport();
    expect(report.lastRun).not.toBeNull();
    expect(typeof report.lastRun.sourced).toBe('number');
  });
});
