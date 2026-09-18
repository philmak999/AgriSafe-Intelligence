import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { herds } from '../src/data/mockData.js';
import { investigate, summarizeDocumentForRisk } from './agent.js';
import { runCycle, startAutomationLoop } from './automation.js';
import { getRecords, getReport } from './store.js';
import { runFarmerCycle, startFarmerLoop } from './farmerLoop.js';
import { sendRegistrationReceivedEmail, sendApprovalEmail, sendRejectionEmail } from './notify.js';
import { attachUser, requireAuth, requireRole, issueSession, clearSession } from './auth.js';
import { getStaffByUsername } from './staffStore.js';
import { seedTestAccounts } from './seedTestAccounts.js';
import { uploadOwnershipDoc, uploadDocument, uploadEvidence } from './upload.js';
import { pool } from './db/pool.js';
import { extractText } from './ocr.js';
import { activityBus } from './activityBus.js';
import { logActivity, getRecentActivity } from './activityStore.js';
import {
  DOCUMENT_CATEGORIES,
  CATEGORY_SUBINDEX_MAP,
  createDocument,
  attachAiResult,
  setSuggestionStatus,
  getDocumentsByFarm,
  getAllDocuments,
  getDocumentById,
  getDocumentFile,
} from './documentStore.js';
import { CHECKLIST_ITEMS, createInspection, getInspectionsByFarm, getAllInspections } from './inspectionStore.js';
import { DEFAULT_ALERT_THRESHOLD, getActiveConfig, saveConfig, getConfigHistory } from './mriConfigStore.js';
import { FACTORS, getFarmSubIndexes, computeComposite } from './mriCompute.js';
import {
  getAllFarmers,
  getPendingFarmers,
  getFarmerByFarm,
  getFarmerByUsername,
  getFarmerDocumentBytes,
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
  const { passwordHash, ...safe } = f;
  return safe;
}

// Unauthenticated liveness probe — used by Render's health checks and by the
// post-deploy check in the CI workflow. Checks the DB too, not just process
// liveness, since a deploy can come up with the DB unreachable.
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, uptime: process.uptime(), db: 'ok' });
  } catch (err) {
    res.status(503).json({ ok: false, uptime: process.uptime(), db: 'unreachable', error: err.message || err.code });
  }
});

// --- Auth ------------------------------------------------------------------

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const staff = await getStaffByUsername(username);
  if (staff) {
    const ok = await bcrypt.compare(password, staff.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect username or password.' });
    issueSession(res, { id: staff.id, role: staff.role, name: staff.name });
    return res.json({ user: { id: staff.id, role: staff.role, name: staff.name } });
  }

  const farmer = await getFarmerByUsername(username);
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

app.get('/api/farmers/claimed', async (req, res) => {
  const claimed = await Promise.all(
    herds.map(async (h) => ({ farmName: h.farm, claimed: await isFarmClaimed(h.farm) }))
  );
  res.json(claimed);
});

app.post('/api/auth/register', authLimiter, uploadOwnershipDoc.single('document'), async (req, res) => {
  const { username, password, name, email, farmName, farmId } = req.body || {};

  if (!username || !password || !name || !email || !farmName || !farmId) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'A document confirming farm ownership is required (PDF, PNG, JPG, or WEBP).' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'That email address doesn\'t look valid.' });
  }
  if ((await isUsernameTaken(username)) || (await getStaffByUsername(username))) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  const herd = herds.find((h) => h.farm === farmName && h.id === farmId);
  if (!herd) {
    return res.status(400).json({
      error: 'Farm name and Herd ID don\'t match our records. Check the Herd Records page for your exact ID.',
    });
  }

  if (await isFarmClaimed(farmName)) {
    const existing = await getFarmerByFarm(farmName);
    return res.status(409).json({
      error:
        existing?.status === 'pending_review'
          ? 'This farm has a registration awaiting staff review.'
          : 'This farm is already registered to another account.',
    });
  }

  try {
    await createFarmer({
      username,
      password,
      name,
      email,
      farmName,
      farmId,
      documentData: req.file.buffer,
      documentMimetype: req.file.mimetype,
      documentOriginalName: req.file.originalname,
    });

    const emailResult = await sendRegistrationReceivedEmail({ to: email, name, farmName });

    res.status(201).json({
      status: 'pending_review',
      emailSent: emailResult.ok,
      emailError: emailResult.ok ? null : emailResult.error,
    });
  } catch (err) {
    console.error('farmer registration failed:', err);
    res.status(502).json({ error: err.message || 'Registration failed' });
  }
});

// --- Staff review queue (scientist-only) ------------------------------------

app.get('/api/farmers', requireRole('scientist'), async (req, res) => {
  res.json((await getAllFarmers()).map(publicFarmer));
});

app.get('/api/farmers/pending', requireRole('scientist'), async (req, res) => {
  res.json((await getPendingFarmers()).map(publicFarmer));
});

app.get('/api/farmers/:id/document', requireRole('scientist'), async (req, res) => {
  const file = await getFarmerDocumentBytes(req.params.id);
  if (!file) return res.status(404).json({ error: 'No document on file.' });
  res.set('Content-Type', file.mimetype || 'application/octet-stream');
  res.set('Content-Disposition', `inline; filename="${file.originalName || 'document'}"`);
  res.send(file.data);
});

app.post('/api/farmers/:id/approve', requireRole('scientist'), async (req, res) => {
  const farmer = await approveFarmer(req.params.id);
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
  const farmer = await rejectFarmer(req.params.id, req.body?.reason);
  if (!farmer) return res.status(404).json({ error: 'Registration not found.' });
  const emailResult = await sendRejectionEmail({
    to: farmer.email,
    name: farmer.name,
    farmName: farmer.farmName,
    reason: req.body?.reason,
  });
  res.json({ farmer: publicFarmer(farmer), emailSent: emailResult.ok });
});

app.delete('/api/farmers/:id', requireRole('scientist'), async (req, res) => {
  try {
    const removed = await deleteFarmer(req.params.id);
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
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: 'OPENROUTER_API_KEY is not set. Add a key from openrouter.ai/keys to your .env file.',
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

app.get('/api/automation/records', requireRole('scientist'), async (req, res) => {
  res.json(await getRecords());
});

app.get('/api/automation/report', requireRole('scientist'), async (req, res) => {
  res.json(await getReport());
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

// --- Documents (cross-collaborative evidence uploads) -----------------------
// Open to every authenticated role: farmers upload for their own farm only
// (forced server-side); inspectors/scientists can upload for, and browse,
// any farm.

function isKnownFarm(farmName) {
  return herds.some((h) => h.farm === farmName);
}

app.post('/api/documents', requireAuth, uploadDocument.single('file'), async (req, res) => {
  const { category, note } = req.body || {};
  const farmName = req.user.role === 'farmer' ? req.user.farmName : req.body?.farmName;

  if (!farmName || !isKnownFarm(farmName)) {
    return res.status(400).json({ error: 'A valid farmName is required.' });
  }
  if (!DOCUMENT_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${DOCUMENT_CATEGORIES.join(', ')}` });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'A file is required (PDF, PNG, JPG, or WEBP).' });
  }

  let document;
  try {
    document = await createDocument({
      farmName,
      category,
      fileData: req.file.buffer,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      uploadedById: req.user.id,
      uploadedByName: req.user.name,
      uploadedByRole: req.user.role,
      note,
    });
  } catch (err) {
    console.error('document record failed:', err);
    return res.status(502).json({ error: 'Failed to save the document record.' });
  }

  await logActivity({
    type: 'document_uploaded',
    farmName,
    actorName: req.user.name,
    actorRole: req.user.role,
    summary: `${req.user.name} uploaded a ${category.replace(/_/g, ' ')} for ${farmName}`,
    detail: { documentId: document.id, category },
  });

  // Real local text extraction (no API key needed), then — if an OpenRouter
  // key is configured — one AI pass that summarizes it and, only for
  // categories that map to a sub-index, proposes a value for a scientist to
  // review. Runs synchronously before responding; a failure here still
  // leaves the upload itself saved.
  try {
    const extractedText = await extractText(req.file.buffer, req.file.mimetype);
    let aiResult = { summary: null, subIndexKey: null, suggestedValue: null, rationale: null };
    if (process.env.OPENROUTER_API_KEY) {
      aiResult = await summarizeDocumentForRisk({ extractedText, category, farmName });
      if (aiResult.subIndexKey && aiResult.subIndexKey !== CATEGORY_SUBINDEX_MAP[category]) {
        aiResult.subIndexKey = null; // only trust a suggestion that matches the declared category
      }
    }
    document = await attachAiResult(document.id, { extractedText, ...aiResult });

    if (aiResult.subIndexKey) {
      await logActivity({
        type: 'ai_suggestion_ready',
        farmName,
        actorName: 'AgriSafe AI',
        actorRole: 'system',
        summary: `AI proposed a ${aiResult.subIndexKey} update for ${farmName} from the uploaded document — awaiting scientist review`,
        detail: { documentId: document.id },
      });
    }
  } catch (err) {
    console.error('document AI processing failed:', err);
  }

  res.status(201).json({ document });
});

app.get('/api/documents', requireAuth, async (req, res) => {
  const farmName = req.user.role === 'farmer' ? req.user.farmName : req.query.farmName;
  res.json(farmName ? await getDocumentsByFarm(farmName) : await getAllDocuments());
});

app.get('/api/documents/:id/file', requireAuth, async (req, res) => {
  const document = await getDocumentById(req.params.id);
  if (!document) return res.status(404).json({ error: 'Document not found.' });
  if (req.user.role === 'farmer' && document.farmName !== req.user.farmName) {
    return res.status(403).json({ error: 'Not authorized for this document.' });
  }
  const file = await getDocumentFile(document.id);
  if (!file) return res.status(404).json({ error: 'File not found.' });
  res.set('Content-Type', file.mimetype);
  res.set('Content-Disposition', `inline; filename="${file.originalName}"`);
  res.send(file.data);
});

app.post('/api/documents/:id/apply-suggestion', requireRole('scientist'), async (req, res) => {
  const document = await getDocumentById(req.params.id);
  if (!document) return res.status(404).json({ error: 'Document not found.' });
  if (!document.suggestedSubindexKey) return res.status(400).json({ error: 'This document has no pending AI suggestion.' });

  const updated = await setSuggestionStatus(document.id, 'approved');
  await logActivity({
    type: 'suggestion_approved',
    farmName: document.farmName,
    actorName: req.user.name,
    actorRole: req.user.role,
    summary: `${req.user.name} approved the ${document.suggestedSubindexKey} update for ${document.farmName}`,
    detail: { documentId: document.id },
  });
  res.json({ document: updated });
});

app.post('/api/documents/:id/dismiss-suggestion', requireRole('scientist'), async (req, res) => {
  const document = await getDocumentById(req.params.id);
  if (!document) return res.status(404).json({ error: 'Document not found.' });
  res.json({ document: await setSuggestionStatus(document.id, 'dismissed') });
});

// --- Inspections (inspector role, open queue) -------------------------------

app.get('/api/inspections/checklist-items', requireAuth, (req, res) => {
  res.json(CHECKLIST_ITEMS);
});

app.post('/api/inspections', requireRole('inspector'), uploadEvidence.array('evidence'), async (req, res) => {
  const { farmName } = req.body || {};
  if (!farmName || !isKnownFarm(farmName)) {
    return res.status(400).json({ error: 'A valid farmName is required.' });
  }

  let checklist;
  try {
    checklist = JSON.parse(req.body?.checklist || '[]');
  } catch {
    return res.status(400).json({ error: 'Invalid checklist payload.' });
  }
  if (!Array.isArray(checklist) || checklist.length !== CHECKLIST_ITEMS.length) {
    return res.status(400).json({ error: 'Checklist must include a result for every item.' });
  }

  let correctiveActions = [];
  try {
    correctiveActions = req.body?.correctiveActions ? JSON.parse(req.body.correctiveActions) : [];
  } catch {
    correctiveActions = [];
  }

  const inspection = await createInspection({
    farmName,
    inspectorId: req.user.id,
    inspectorName: req.user.name,
    checklist,
    correctiveActions,
  });

  // Evidence photos go through the same storage path as /api/documents,
  // tagged with this inspection's id so they show up attached to it.
  const evidenceDocs = [];
  for (const file of req.files || []) {
    try {
      evidenceDocs.push(
        await createDocument({
          farmName,
          category: 'inspection_evidence',
          fileData: file.buffer,
          originalName: file.originalname,
          mimetype: file.mimetype,
          uploadedById: req.user.id,
          uploadedByName: req.user.name,
          uploadedByRole: req.user.role,
          inspectionId: inspection.id,
        })
      );
    } catch (err) {
      console.error('inspection evidence save failed:', err);
    }
  }

  await logActivity({
    type: 'inspection_submitted',
    farmName,
    actorName: req.user.name,
    actorRole: req.user.role,
    summary: `${req.user.name} submitted a biosecurity inspection for ${farmName} — ${inspection.overallResult.toUpperCase()} (${inspection.passedCount}/${inspection.passedCount + inspection.failedCount} passed)`,
    detail: { inspectionId: inspection.id },
  });

  res.status(201).json({ inspection, evidenceDocs });
});

app.get('/api/inspections', requireAuth, async (req, res) => {
  const farmName = req.user.role === 'farmer' ? req.user.farmName : req.query.farmName;
  res.json(farmName ? await getInspectionsByFarm(farmName) : await getAllInspections());
});

// --- MRI methodology (scientist-governed, evidence-sourced per farm) -------

app.get('/api/mri-config', requireAuth, async (req, res) => {
  const config = await getActiveConfig();
  const farmName = req.query.farmName || (req.user.role === 'farmer' ? req.user.farmName : null);

  if (!farmName) {
    return res.json({ weights: config.weights, alertThreshold: config.alertThreshold });
  }
  if (!isKnownFarm(farmName)) return res.status(400).json({ error: 'Unknown farm.' });

  const subIndexes = await getFarmSubIndexes(farmName);
  res.json({
    farmName,
    weights: config.weights,
    alertThreshold: config.alertThreshold,
    subIndexes,
    compositeScore: computeComposite(subIndexes, config.weights),
  });
});

app.post('/api/mri-config', requireRole('scientist'), async (req, res) => {
  const { weights, alertThreshold, reason } = req.body || {};
  if (!weights || typeof weights !== 'object' || !reason || !reason.trim()) {
    return res.status(400).json({ error: 'weights and a written reason are both required.' });
  }
  const sum = FACTORS.reduce((acc, f) => acc + Number(weights[f.key] || 0), 0);
  if (Math.abs(sum - 100) > 0.5) {
    return res.status(400).json({ error: 'Sub-index weights must sum to 100.' });
  }

  const config = await saveConfig({
    weights,
    alertThreshold: Number.isFinite(Number(alertThreshold)) ? Number(alertThreshold) : DEFAULT_ALERT_THRESHOLD,
    changedById: req.user.id,
    changedByName: req.user.name,
    reason: reason.trim(),
  });

  await logActivity({
    type: 'mri_config_changed',
    farmName: null,
    actorName: req.user.name,
    actorRole: req.user.role,
    summary: `${req.user.name} updated the MRI scoring methodology: ${reason.trim()}`,
    detail: { configId: config.id, weights: config.weights },
  });

  res.status(201).json({ config });
});

app.get('/api/mri-config/history', requireRole('scientist'), async (req, res) => {
  res.json(await getConfigHistory());
});

// --- Live cross-role activity feed ------------------------------------------
// Farmers don't need a cross-farm feed; this is for the people who need to
// know the moment new evidence comes in — inspectors and scientists.

app.get('/api/activity', requireRole(['scientist', 'inspector']), async (req, res) => {
  res.json(await getRecentActivity(30));
});

app.get('/api/activity/stream', requireRole(['scientist', 'inspector']), (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(': connected\n\n');

  const onActivity = (activity) => res.write(`data: ${JSON.stringify(activity)}\n\n`);
  activityBus.on('activity', onActivity);

  // Keeps the connection alive through proxies/load balancers that would
  // otherwise time out an idle response.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    activityBus.off('activity', onActivity);
  });
});

// Multer errors (bad file type, too large) land here rather than the route handler.
app.use((err, req, res, next) => {
  if (err) {
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
