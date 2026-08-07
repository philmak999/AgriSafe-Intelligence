import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, 'data', 'staff.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  } catch {
    return { staff: [] };
  }
}

function save(state) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2));
}

let state = load();

export function getStaffByUsername(username) {
  return state.staff.find((s) => s.username.toLowerCase() === username.toLowerCase()) || null;
}

export async function createStaffAccount({ username, password, name }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const staff = {
    id: `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    username,
    passwordHash,
    name,
    role: 'scientist',
    createdAt: new Date().toISOString(),
  };
  state.staff.push(staff);
  save(state);
  return staff;
}
