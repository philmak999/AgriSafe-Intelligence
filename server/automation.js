import { riskFlags } from '../src/data/mockData.js';
import { investigate } from './agent.js';
import { sendEmailNotification } from './notify.js';
import { getRecordByFarm, upsertRecord, addHistory, addRun } from './store.js';

const LOOP_INTERVAL_MS = Number(process.env.AUTOMATION_LOOP_INTERVAL_MS) || 5 * 60 * 1000; // 5 min
const REVIEW_INTERVAL_MS = Number(process.env.AUTOMATION_REVIEW_INTERVAL_MS) || 12 * 60 * 60 * 1000; // 12h

let running = false;

// "Sourcing" — scan the app's own risk data for anything that needs attention.
// In production this is where a real external feed would plug in; for now the
// source of truth is the same mock risk data the dashboard renders.
export function sourceCandidates() {
  return riskFlags
    .filter((f) => f.risk === 'HIGH' || f.risk === 'MED')
    .map((f) => ({ farmName: f.farm, riskLevel: f.risk, sourceReason: `Risk Flag Detected: Score ${f.score} (${f.risk})` }));
}

export function needsReview(existing) {
  if (!existing) return true;
  if (!existing.lastReviewedAt) return true;
  return Date.now() - new Date(existing.lastReviewedAt).getTime() > REVIEW_INTERVAL_MS;
}

export async function runCycle({ force = false } = {}) {
  if (running) return { skipped: true, reason: 'A cycle is already running' };
  running = true;
  const startedAt = Date.now();
  const summary = { sourced: 0, processed: 0, notified: 0, failed: 0 };

  try {
    const candidates = sourceCandidates();
    summary.sourced = candidates.length;

    for (const candidate of candidates) {
      const existing = await getRecordByFarm(candidate.farmName);
      if (!force && !needsReview(existing)) continue;

      summary.processed += 1;

      await upsertRecord(candidate.farmName, {
        status: 'investigating',
        riskLevel: candidate.riskLevel,
        sourceReason: candidate.sourceReason,
      });
      await addHistory(candidate.farmName, 'sourced', candidate.sourceReason);

      try {
        const result = await investigate(candidate.farmName);

        await upsertRecord(candidate.farmName, {
          status: 'notifying',
          riskLevel: result.riskLevel || candidate.riskLevel,
          investigation: result.report,
          lastReviewedAt: new Date().toISOString(),
        });
        await addHistory(candidate.farmName, 'investigated', result.report.summary || 'Investigation complete');

        const notifyResult = await sendEmailNotification({
          farmName: candidate.farmName,
          riskLevel: result.riskLevel || candidate.riskLevel,
          sourceReason: candidate.sourceReason,
          report: result.report,
        });

        if (notifyResult.ok) {
          await upsertRecord(candidate.farmName, { status: 'notified', notification: notifyResult });
          await addHistory(candidate.farmName, 'notified', 'Email notification sent');
          summary.notified += 1;
        } else if (notifyResult.skipped) {
          await upsertRecord(candidate.farmName, { status: 'notify_skipped', notification: notifyResult });
          await addHistory(candidate.farmName, 'notify_skipped', notifyResult.error);
        } else {
          await upsertRecord(candidate.farmName, { status: 'notify_failed', notification: notifyResult });
          await addHistory(candidate.farmName, 'notify_failed', notifyResult.error);
          summary.failed += 1;
        }
      } catch (err) {
        await upsertRecord(candidate.farmName, { status: 'investigation_failed', lastReviewedAt: new Date().toISOString() });
        await addHistory(candidate.farmName, 'investigation_failed', err.message || 'Investigation agent failed');
        summary.failed += 1;
      }
    }

    await addRun({ ...summary, durationMs: Date.now() - startedAt });
    return summary;
  } finally {
    running = false;
  }
}

let timer = null;

export function startAutomationLoop() {
  if (timer) return;
  console.log(`Automation loop starting — every ${Math.round(LOOP_INTERVAL_MS / 1000)}s, re-review after ${Math.round(REVIEW_INTERVAL_MS / 3600000)}h`);
  runCycle().catch((err) => console.error('Automation cycle failed:', err));
  timer = setInterval(() => {
    runCycle().catch((err) => console.error('Automation cycle failed:', err));
  }, LOOP_INTERVAL_MS);
}
