import { herds, complianceReports, riskTimelineEvents } from '../src/data/mockData.js';
import { sendReminderEmail, sendWeeklyReportEmail } from './notify.js';
import { getActiveFarmers, updateFarmer } from './farmerStore.js';

const REMINDER_WINDOW_DAYS = Number(process.env.REMINDER_WINDOW_DAYS) || 14;
const REMINDER_COOLDOWN_DAYS = Number(process.env.REMINDER_COOLDOWN_DAYS) || 3;
const WEEKLY_REPORT_DAY = process.env.WEEKLY_REPORT_DAY || 'Monday';
const FARMER_LOOP_INTERVAL_MS = Number(process.env.FARMER_LOOP_INTERVAL_MS) || 24 * 60 * 60 * 1000; // daily

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return Math.round((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
}

function dueLabel(days) {
  if (days < 0) return `overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'due today';
  return `due in ${days} day${days === 1 ? '' : 's'}`;
}

function buildReminderItems(farmName) {
  const items = [];
  const herd = herds.find((h) => h.farm === farmName);

  if (herd?.nextInspectionDue) {
    const d = daysUntil(herd.nextInspectionDue);
    if (d <= REMINDER_WINDOW_DAYS) {
      items.push({ label: 'Inspection', detail: `${dueLabel(d)} (${herd.nextInspectionDue})` });
    }
  }

  for (const cr of complianceReports.filter((c) => c.facility === farmName && c.dueDate)) {
    const d = daysUntil(cr.dueDate);
    if (d <= REMINDER_WINDOW_DAYS) {
      items.push({ label: `Compliance filing — ${cr.regulation}`, detail: `${dueLabel(d)} (${cr.dueDate})` });
    }
  }

  return items;
}

function buildWeeklySnapshot(farmName) {
  const herd = herds.find((h) => h.farm === farmName);
  if (!herd) return null;

  const pending = complianceReports.find((c) => c.facility === farmName && c.status === 'REVIEW');
  const compliant = complianceReports.find((c) => c.facility === farmName && c.status === 'PASS');
  const complianceNote = pending
    ? `${pending.regulation} filing pending, ${dueLabel(daysUntil(pending.dueDate))}`
    : compliant
      ? `Compliant as of ${compliant.filed} (${compliant.regulation})`
      : null;

  const recentEvents = riskTimelineEvents
    .filter((e) => e.farm === farmName)
    .slice(0, 3)
    .map((e) => `${e.date}: ${e.description}`);

  return {
    riskLevel: herd.risk,
    mri: herd.mri,
    vaccination: herd.vaccination,
    lastInspection: herd.lastInspection,
    nextInspectionDue: herd.nextInspectionDue,
    complianceNote,
    recentEvents,
  };
}

function isWeeklyReportDueToday() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return today === WEEKLY_REPORT_DAY;
}

export async function runFarmerCycle({ force = false } = {}) {
  const summary = { farmers: 0, reminded: 0, weeklyReports: 0 };
  const farmers = getActiveFarmers();
  summary.farmers = farmers.length;

  for (const farmer of farmers) {
    if (farmer.preferences?.reminders !== false) {
      const items = buildReminderItems(farmer.farmName);
      const cooledDown = daysSince(farmer.lastReminderSentAt) >= REMINDER_COOLDOWN_DAYS;
      if (items.length > 0 && (force || cooledDown)) {
        const result = await sendReminderEmail({
          to: farmer.email,
          name: farmer.name,
          farmName: farmer.farmName,
          items,
        });
        if (result.ok) {
          updateFarmer(farmer.id, { lastReminderSentAt: new Date().toISOString() });
          summary.reminded += 1;
        }
      }
    }

    if (farmer.preferences?.weeklyReport !== false && (force || isWeeklyReportDueToday())) {
      const alreadySentThisWeek = daysSince(farmer.lastWeeklyReportSentAt) < 6;
      if (force || !alreadySentThisWeek) {
        const snapshot = buildWeeklySnapshot(farmer.farmName);
        if (snapshot) {
          const result = await sendWeeklyReportEmail({
            to: farmer.email,
            name: farmer.name,
            farmName: farmer.farmName,
            snapshot,
          });
          if (result.ok) {
            updateFarmer(farmer.id, { lastWeeklyReportSentAt: new Date().toISOString() });
            summary.weeklyReports += 1;
          }
        }
      }
    }
  }

  return summary;
}

let timer = null;

export function startFarmerLoop() {
  if (timer) return;
  console.log(
    `Farmer notification loop starting — every ${Math.round(FARMER_LOOP_INTERVAL_MS / 3600000)}h, reminder window ${REMINDER_WINDOW_DAYS}d, weekly reports on ${WEEKLY_REPORT_DAY}`
  );
  runFarmerCycle().catch((err) => console.error('Farmer cycle failed:', err));
  timer = setInterval(() => {
    runFarmerCycle().catch((err) => console.error('Farmer cycle failed:', err));
  }, FARMER_LOOP_INTERVAL_MS);
}
