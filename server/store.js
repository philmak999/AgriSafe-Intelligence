import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, 'data', 'automation-store.json');

function load() {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { records: [], runs: [] };
  }
}

function save(state) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2));
}

let state = load();

export function getRecords() {
  return [...state.records].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function getRecordByFarm(farmName) {
  return state.records.find((r) => r.farmName === farmName) || null;
}

export function upsertRecord(farmName, patch) {
  const now = new Date().toISOString();
  let record = state.records.find((r) => r.farmName === farmName);

  if (!record) {
    record = {
      id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      farmName,
      createdAt: now,
      history: [],
    };
    state.records.push(record);
  }

  Object.assign(record, patch, { updatedAt: now });
  save(state);
  return record;
}

export function addHistory(farmName, event, detail) {
  const record = state.records.find((r) => r.farmName === farmName);
  if (!record) return;
  record.history.push({ at: new Date().toISOString(), event, detail });
  record.updatedAt = new Date().toISOString();
  save(state);
}

export function addRun(summary) {
  state.runs.unshift({ at: new Date().toISOString(), ...summary });
  state.runs = state.runs.slice(0, 50);
  save(state);
}

export function getReport() {
  const records = state.records;
  const byStatus = {};
  const byRisk = {};
  for (const r of records) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    if (r.riskLevel) byRisk[r.riskLevel] = (byRisk[r.riskLevel] || 0) + 1;
  }
  return {
    totalTracked: records.length,
    byStatus,
    byRisk,
    lastRun: state.runs[0] || null,
    runs: state.runs,
  };
}
