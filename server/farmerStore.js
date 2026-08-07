import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, 'data', 'farmers.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  } catch {
    return { farmers: [] };
  }
}

function save(state) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2));
}

let state = load();

export function getAllFarmers() {
  return [...state.farmers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getPendingFarmers() {
  return getAllFarmers().filter((f) => f.status === 'pending_review');
}

export function getActiveFarmers() {
  return state.farmers.filter((f) => f.status === 'active');
}

export function getFarmerById(id) {
  return state.farmers.find((f) => f.id === id) || null;
}

export function getFarmerByFarm(farmName) {
  return state.farmers.find((f) => f.farmName === farmName) || null;
}

export function getFarmerByUsername(username) {
  return state.farmers.find((f) => f.username.toLowerCase() === username.toLowerCase()) || null;
}

// A farm is "claimed" if there's a registration for it that's active or
// still awaiting staff review, so a second signup can't race an approval.
export function isFarmClaimed(farmName) {
  return state.farmers.some(
    (f) => f.farmName === farmName && (f.status === 'active' || f.status === 'pending_review')
  );
}

export function isUsernameTaken(username) {
  return state.farmers.some((f) => f.username.toLowerCase() === username.toLowerCase());
}

export async function createFarmer({ username, password, name, email, farmName, farmId, documentPath, documentOriginalName }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  const farmer = {
    id: `farmer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    username,
    passwordHash,
    name,
    email,
    farmName,
    farmId,
    role: 'farmer',
    status: 'pending_review',
    documentPath,
    documentOriginalName,
    preferences: { reminders: true, weeklyReport: true },
    reviewedAt: null,
    reviewNote: null,
    lastReminderSentAt: null,
    lastWeeklyReportSentAt: null,
    createdAt: now,
    updatedAt: now,
  };

  state.farmers.push(farmer);
  save(state);
  return farmer;
}

export function approveFarmer(id) {
  const farmer = state.farmers.find((f) => f.id === id);
  if (!farmer) return null;
  farmer.status = 'active';
  farmer.reviewedAt = new Date().toISOString();
  farmer.reviewNote = null;
  farmer.updatedAt = new Date().toISOString();
  save(state);
  return farmer;
}

export function rejectFarmer(id, reason) {
  const farmer = state.farmers.find((f) => f.id === id);
  if (!farmer) return null;
  farmer.status = 'rejected';
  farmer.reviewedAt = new Date().toISOString();
  farmer.reviewNote = reason || null;
  farmer.updatedAt = new Date().toISOString();
  save(state);
  return farmer;
}

export function updateFarmer(id, patch) {
  const farmer = state.farmers.find((f) => f.id === id);
  if (!farmer) return null;
  Object.assign(farmer, patch, { updatedAt: new Date().toISOString() });
  save(state);
  return farmer;
}

export function deleteFarmer(id) {
  const before = state.farmers.length;
  state.farmers = state.farmers.filter((f) => f.id !== id);
  const removed = state.farmers.length < before;
  if (removed) save(state);
  return removed;
}
