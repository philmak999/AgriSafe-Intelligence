import nodemailer from 'nodemailer';

let transporter = null;
let transporterConfigKey = null;

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  const configKey = `${SMTP_HOST}:${SMTP_PORT}:${SMTP_USER}`;
  if (transporter && transporterConfigKey === configKey) return transporter;

  const port = Number(SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  transporterConfigKey = configKey;
  return transporter;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function wrapHtml(bodyHtml) {
  return `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 560px; color: #1a1a18;">
      <div style="font-family: monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #888780; margin-bottom: 10px;">
        AgriSafe Intelligence
      </div>
      ${bodyHtml}
    </div>
  `;
}

async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t || !to) {
    return {
      ok: false,
      skipped: true,
      error: 'Email is not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env',
    };
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text, html });
    return { ok: true, skipped: false };
  } catch (err) {
    return { ok: false, skipped: false, error: err.message || 'Email send failed' };
  }
}

// --- Ops notification (risk-follow-up automation loop) ---------------------

export async function sendEmailNotification({ farmName, riskLevel, sourceReason, report }) {
  const to = process.env.NOTIFY_EMAIL_TO;
  if (!to) {
    return { ok: false, skipped: true, error: 'NOTIFY_EMAIL_TO is not set in .env' };
  }

  const subject = `AgriSafe Automation — ${riskLevel || 'Risk'} follow-up: ${farmName}`;
  const findingsList = report.findings || [];

  const text = [
    subject,
    `Sourced from: ${sourceReason}`,
    '',
    report.summary ? `Summary: ${report.summary}` : null,
    findingsList.length ? `Findings:\n${findingsList.map((f) => `- ${f}`).join('\n')}` : null,
    report.recommendation ? `Recommendation: ${report.recommendation}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  const html = wrapHtml(`
    <h2 style="margin: 0 0 4px; font-size: 18px;">${escapeHtml(farmName)}</h2>
    <p style="margin: 0 0 16px; font-size: 12px; color: #888780; text-transform: uppercase; letter-spacing: 0.04em;">
      ${escapeHtml(riskLevel || 'Risk')} follow-up · ${escapeHtml(sourceReason)}
    </p>
    ${report.summary ? `<p style="font-size: 14px; line-height: 1.5;"><strong>Summary:</strong> ${escapeHtml(report.summary)}</p>` : ''}
    ${
      findingsList.length
        ? `<p style="font-size: 14px; margin-bottom: 6px;"><strong>Findings:</strong></p>
           <ul style="font-size: 13.5px; line-height: 1.5; padding-left: 20px;">
             ${findingsList.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
           </ul>`
        : ''
    }
    ${
      report.recommendation
        ? `<p style="font-size: 14px; background: #F1EFE8; border-radius: 8px; padding: 12px 14px;">
             <strong>Recommendation:</strong> ${escapeHtml(report.recommendation)}
           </p>`
        : ''
    }
  `);

  return sendMail({ to, subject, text, html });
}

// --- Farmer-facing emails ---------------------------------------------------

export async function sendRegistrationReceivedEmail({ to, name, farmName }) {
  const subject = `Registration received — ${farmName}`;
  const text = `Hi ${name},\n\nWe received your registration for ${farmName}, along with your ownership documentation. An AgriSafe Intelligence staff member will review it shortly — you'll get another email once it's approved and you can log in.`;
  const html = wrapHtml(`
    <h2 style="margin: 0 0 12px; font-size: 18px;">Registration received</h2>
    <p style="font-size: 14px; line-height: 1.6;">
      Hi ${escapeHtml(name)}, we received your registration for <strong>${escapeHtml(farmName)}</strong>,
      along with your ownership documentation. An AgriSafe Intelligence staff member will review it
      shortly — you'll get another email once it's approved and you can log in.
    </p>
  `);
  return sendMail({ to, subject, text, html });
}

export async function sendApprovalEmail({ to, name, farmName, loginUrl }) {
  const subject = `You're approved — ${farmName}`;
  const text = `Hi ${name},\n\nYour registration for ${farmName} has been reviewed and approved. You can now log in to AgriSafe Intelligence with the username and password you set during registration.\n\nLog in here: ${loginUrl}`;
  const html = wrapHtml(`
    <h2 style="margin: 0 0 12px; font-size: 18px;">You're approved</h2>
    <p style="font-size: 14px; line-height: 1.6;">
      Hi ${escapeHtml(name)}, your registration for <strong>${escapeHtml(farmName)}</strong> has been
      reviewed and approved. You can now log in with the username and password you set during registration.
    </p>
    <p style="margin: 20px 0;">
      <a href="${loginUrl}" style="background: #1D9E75; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 14px; display: inline-block;">
        Log in
      </a>
    </p>
  `);
  return sendMail({ to, subject, text, html });
}

export async function sendRejectionEmail({ to, name, farmName, reason }) {
  const subject = `Registration not approved — ${farmName}`;
  const text = `Hi ${name},\n\nYour registration for ${farmName} could not be approved.${reason ? ` Reason: ${reason}` : ''}\n\nIf you believe this is a mistake, please register again with corrected information and documentation.`;
  const html = wrapHtml(`
    <h2 style="margin: 0 0 12px; font-size: 18px;">Registration not approved</h2>
    <p style="font-size: 14px; line-height: 1.6;">
      Hi ${escapeHtml(name)}, your registration for <strong>${escapeHtml(farmName)}</strong> could not
      be approved.${reason ? ` <strong>Reason:</strong> ${escapeHtml(reason)}` : ''}
    </p>
    <p style="font-size: 13px; color: #888780;">
      If you believe this is a mistake, you're welcome to register again with corrected information
      and documentation.
    </p>
  `);
  return sendMail({ to, subject, text, html });
}

export async function sendReminderEmail({ to, name, farmName, items }) {
  const subject = `Reminder: ${items.length} item${items.length === 1 ? '' : 's'} due for ${farmName}`;
  const text = [
    `Hi ${name},`,
    '',
    `The following items need attention for ${farmName}:`,
    ...items.map((i) => `- ${i.label}: ${i.detail}`),
  ].join('\n');

  const html = wrapHtml(`
    <h2 style="margin: 0 0 4px; font-size: 18px;">${escapeHtml(farmName)}</h2>
    <p style="margin: 0 0 16px; font-size: 12px; color: #888780; text-transform: uppercase; letter-spacing: 0.04em;">
      Reminder
    </p>
    <p style="font-size: 14px;">Hi ${escapeHtml(name)}, the following items need attention:</p>
    <ul style="font-size: 13.5px; line-height: 1.6; padding-left: 20px;">
      ${items.map((i) => `<li><strong>${escapeHtml(i.label)}:</strong> ${escapeHtml(i.detail)}</li>`).join('')}
    </ul>
  `);
  return sendMail({ to, subject, text, html });
}

export async function sendWeeklyReportEmail({ to, name, farmName, snapshot }) {
  const subject = `Weekly report — ${farmName}`;
  const text = [
    `Hi ${name}, here's your weekly AgriSafe report for ${farmName}:`,
    '',
    `Risk level: ${snapshot.riskLevel} (MRI ${snapshot.mri})`,
    `Vaccination coverage: ${snapshot.vaccination}%`,
    `Last inspection: ${snapshot.lastInspection}`,
    `Next inspection due: ${snapshot.nextInspectionDue}`,
    snapshot.complianceNote ? `Compliance: ${snapshot.complianceNote}` : null,
    snapshot.recentEvents.length
      ? `Recent activity:\n${snapshot.recentEvents.map((e) => `- ${e}`).join('\n')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const html = wrapHtml(`
    <h2 style="margin: 0 0 4px; font-size: 18px;">${escapeHtml(farmName)}</h2>
    <p style="margin: 0 0 16px; font-size: 12px; color: #888780; text-transform: uppercase; letter-spacing: 0.04em;">
      Weekly report
    </p>
    <p style="font-size: 14px;">Hi ${escapeHtml(name)}, here's how your farm looks this week:</p>
    <table style="font-size: 13.5px; border-collapse: collapse; margin: 10px 0 16px;">
      <tr><td style="color:#888780; padding: 3px 12px 3px 0;">Risk level</td><td><strong>${escapeHtml(snapshot.riskLevel)}</strong> (MRI ${snapshot.mri})</td></tr>
      <tr><td style="color:#888780; padding: 3px 12px 3px 0;">Vaccination coverage</td><td>${snapshot.vaccination}%</td></tr>
      <tr><td style="color:#888780; padding: 3px 12px 3px 0;">Last inspection</td><td>${escapeHtml(snapshot.lastInspection)}</td></tr>
      <tr><td style="color:#888780; padding: 3px 12px 3px 0;">Next inspection due</td><td>${escapeHtml(snapshot.nextInspectionDue)}</td></tr>
      ${snapshot.complianceNote ? `<tr><td style="color:#888780; padding: 3px 12px 3px 0;">Compliance</td><td>${escapeHtml(snapshot.complianceNote)}</td></tr>` : ''}
    </table>
    ${
      snapshot.recentEvents.length
        ? `<p style="font-size: 14px; margin-bottom: 6px;"><strong>Recent activity:</strong></p>
           <ul style="font-size: 13.5px; line-height: 1.6; padding-left: 20px;">
             ${snapshot.recentEvents.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}
           </ul>`
        : '<p style="font-size: 13px; color: #888780;">No new activity this week.</p>'
    }
  `);
  return sendMail({ to, subject, text, html });
}
