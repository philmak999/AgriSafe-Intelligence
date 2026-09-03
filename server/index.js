import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { herds } from '../src/data/mockData.js';
import { investigate } from './agent.js';
import { runCycle, startAutomationLoop } from './automation.js';
import { getRecords, getReport } from './store.js';
import { runFarmerCycle, startFarmerLoop } from './farmerLoop.js';
import { sendRegistrationReceivedEmail, sendApprovalEmail, sendRejectionEmail } from './notify.js';
import { attachUser, requireAuth, requireRole, issueSession, clearSession } from './auth.js';
import { getStaffByUsername } from './staffStore.js';
import { seedTestAccounts } from './seedTestAccounts.js';
import { uploadOwnershipDoc } from './upload.js';
import {
  getAllFarmers,
  getPendingFarmers,
  getFarmerById,
  getFarmerByFarm,
  getFarmerByUsername,
  isFarmClaimed,
  isUsernameTaken,
  createFarmer,
  approveFarmer,
  rejectFarmer,
  deleteFarmer,
} from './farmerStore.js';

// Explicit allowlist (not `origin: true`, which reflects *any* origin) —
// this API sets an auth cookie, so only known frontends should be allowed to
// make credentialed cross-origin requests. Comma-separated via env var so
// the deployed GitHub Pages origin can be added without a code change.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} is not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

// Login and registration are the only unauthenticated write endpoints, so
// they're the only ones a brute-force/credential-stuffing script can hammer
// without a session. Keyed by IP; a real deploy behind a proxy needs
// `app.set('trust proxy', ...)` for that to reflect the real client IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
});

const FRONTEND_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicFarmer(f) {
  const { passwordHash, documentPath, ...safe } = f;
  return safe;
}

function cleanupUpload(req) {
  if (req.file?.path) fs.unlink(req.file.path, () => {});
}

// Unauthenticated liveness probe — used by Render's health checks and by the
// post-deploy check in the CI workflow. Deliberately reveals nothing about
// app state beyond "the process is up".
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// --- Auth ------------------------------------------------------------------

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const staff = getStaffByUsername(username);
  if (staff) {
    const ok = await bcrypt.compare(password, staff.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect username or password.' });
    issueSession(res, { id: staff.id, role: 'scientist', name: staff.name });
    return res.json({ user: { id: staff.id, role: 'scientist', name: staff.name } });
  }

  const farmer = getFarmerByUsername(username);
  if (!farmer) return res.status(401).json({ error: 'Incorrect username or password.' });

  const ok = await bcrypt.compare(password, farmer.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Incorrect username or password.' });

  if (farmer.status === 'pending_review') {
    return res.status(403).json({ error: 'Your registration is still awaiting AgriSafe staff review.' });
  }
  if (farmer.status === 'rejected') {
    return res.status(403).json({ error: 'Your registration was not approved. Contact AgriSafe support.' });
  }

  issueSession(res, { id: farmer.id, role: 'farmer', name: farmer.name, farmName: farmer.farmName });
  res.json({ user: { id: farmer.id, role: 'farmer', name: farmer.name, farmName: farmer.farmName } });
});

app.post('/api/auth/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user || null });
});

// --- Farmer registration (public) ------------------------------------------

app.get('/api/farmers/claimed', (req, res) => {
  res.json(herds.map((h) => ({ farmName: h.farm, claimed: isFarmClaimed(h.farm) })));
});

app.post('/api/auth/register', authLimiter, uploadOwnershipDoc.single('document'), async (req, res) => {
  const { username, password, name, email, farmName, farmId } = req.body || {};

  if (!username || !password || !name || !email || !farmName || !farmId) {
    cleanupUpload(req);
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'A document confirming farm ownership is required (PDF, PNG, JPG, or WEBP).' });
  }
  if (password.length < 8) {
    cleanupUpload(req);
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (!EMAIL_RE.test(email)) {
    cleanupUpload(req);
    return res.status(400).json({ error: 'That email address doesn\'t look valid.' });
  }
  if (isUsernameTaken(username) || getStaffByUsername(username)) {
    cleanupUpload(req);
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  const herd = herds.find((h) => h.farm === farmName && h.id === farmId);
  if (!herd) {
    cleanupUpload(req);
    return res.status(400).json({
      error: 'Farm name and Herd ID don\'t match our records. Check the Herd Records page for your exact ID.',
    });
  }

  if (isFarmClaimed(farmName)) {
    cleanupUpload(req);
    const existing = getFarmerByFarm(farmName);
    return res.status(409).json({
      error:
        existing?.status === 'pending_review'
          ? 'This farm has a registration awaiting staff review.'
          : 'This farm is already registered to another account.',
    });
  }

  try {
    const farmer = await createFarmer({
      username,
      password,
      name,
      email,
      farmName,
      farmId,
      documentPath: req.file.path,
      documentOriginalName: req.file.originalname,
    });

    const emailResult = await sendRegistrationReceivedEmail({ to: email, name, farmName });

    res.status(201).json({
      status: 'pending_review',
      emailSent: emailResult.ok,
      emailError: emailResult.ok ? null : emailResult.error,
    });
  } catch (err) {
    cleanupUpload(req);
    console.error('farmer registration failed:', err);
    res.status(502).json({ error: err.message || 'Registration failed' });
  }
});

// --- Staff review queue (scientist-only) ------------------------------------

app.get('/api/farmers', requireRole('scientist'), (req, res) => {
  res.json(getAllFarmers().map(publicFarmer));
});

app.get('/api/farmers/pending', requireRole('scientist'), (req, res) => {
  res.json(getPendingFarmers().map(publicFarmer));
});

app.get('/api/farmers/:id/document', requireRole('scientist'), (req, res) => {
  const farmer = getFarmerById(req.params.id);
  if (!farmer?.documentPath || !fs.existsSync(farmer.documentPath)) {
    return res.status(404).json({ error: 'No document on file.' });
  }
  res.sendFile(path.resolve(farmer.documentPath));
});

app.post('/api/farmers/:id/approve', requireRole('scientist'), async (req, res) => {
  const farmer = approveFarmer(req.params.id);
  if (!farmer) return res.status(404).json({ error: 'Registration not found.' });
  const emailResult = await sendApprovalEmail({
    to: farmer.email,
    name: farmer.name,
    farmName: farmer.farmName,
    loginUrl: `${FRONTEND_BASE_URL}/login`,
  });
  res.json({ farmer: publicFarmer(farmer), emailSent: emailResult.ok });
});

app.post('/api/farmers/:id/reject', requireRole('scientist'), async (req, res) => {
  const farmer = rejectFarmer(req.params.id, req.body?.reason);
  if (!farmer) return res.status(404).json({ error: 'Registration not found.' });
  const emailResult = await sendRejectionEmail({
    to: farmer.email,
    name: farmer.name,
    farmName: farmer.farmName,
    reason: req.body?.reason,
  });
  res.json({ farmer: publicFarmer(farmer), emailSent: emailResult.ok });
});

app.delete('/api/farmers/:id', requireRole('scientist'), (req, res) => {
  try {
    const removed = deleteFarmer(req.params.id);
    if (!removed) return res.status(404).json({ error: 'No registration found with that ID.' });
    res.json({ removed: true });
  } catch (err) {
    console.error('farmer delete failed:', err);
    res.status(500).json({ error: err.message || 'Failed to remove registration' });
  }
});

// --- Internal ops tools (scientist-only) ------------------------------------

app.post('/api/investigate', requireRole('scientist'), async (req, res) => {
  const { farmName } = req.body || {};
  if (!farmName || typeof farmName !== 'string') {
    return res.status(400).json({ error: 'farmName is required' });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is not set. Add a free key from console.groq.com to your .env file.',
    });
  }

  try {
    const result = await investigate(farmName);
    res.json(result);
  } catch (err) {
    console.error('investigate failed:', err);
    res.status(502).json({ error: err.message || 'Investigation failed' });
  }
});

app.get('/api/automation/records', requireRole('scientist'), (req, res) => {
  res.json(getRecords());
});

app.get('/api/automation/report', requireRole('scientist'), (req, res) => {
  res.json(getReport());
});

app.post('/api/automation/run-now', requireRole('scientist'), async (req, res) => {
  try {
    const summary = await runCycle({ force: req.body?.force === true });
    res.json(summary);
  } catch (err) {
    console.error('automation run-now failed:', err);
    res.status(502).json({ error: err.message || 'Automation cycle failed' });
  }
});

app.post('/api/farmer-loop/run-now', requireRole('scientist'), async (req, res) => {
  try {
    const summary = await runFarmerCycle({ force: req.body?.force === true });
    res.json(summary);
  } catch (err) {
    console.error('farmer-loop run-now failed:', err);
    res.status(502).json({ error: err.message || 'Farmer notification cycle failed' });
  }
});

// Multer errors (bad file type, too large) land here rather than the route handler.
app.use((err, req, res, next) => {
  if (err) {
    cleanupUpload(req);
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }
  next();
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`AgriSafe API server listening on http://localhost:${port}`);
  seedTestAccounts().catch((err) => console.error('Failed to seed test accounts:', err));
  startAutomationLoop();
  startFarmerLoop();
});
