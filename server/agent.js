import Groq from 'groq-sdk';
import { toolDefinitions, toolImplementations } from './tools.js';

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const MAX_ITERATIONS = 6;

// Constructed lazily so the server can boot even before GROQ_API_KEY is set —
// the route handler checks for the key and returns a clear error first.
let groq = null;
function getClient() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

const SYSTEM_PROMPT = `You are the AgriSafe Intelligence Risk Investigation Agent, an assistant for biosecurity inspectors and producers monitoring farms and processing facilities across the Ontario + NYS corridor.

Given a farm or facility name, investigate its current biosecurity risk by calling the available tools to gather:
- its herd registry record (species, head count, vaccination rate, MRI score, risk level)
- recent risk timeline events
- inspection history
- compliance filing status

Call tools as needed (a name may only match some of them — that's fine, note what's missing). Once you have enough information, respond with a plain-text investigation report using exactly this structure, with no markdown formatting (no asterisks, no headers):

SUMMARY:
One or two sentences on the current risk posture.

FINDINGS:
- One fact per line, each starting with a dash, citing its source in parentheses.
- Another fact per line.

RECOMMENDATION:
One concrete next action (e.g. schedule inspection, notify producer, escalate to regulator, no action needed) with a one-sentence justification.

Be factual and only reference data returned by the tools. Do not fabricate records. Keep the whole report under 180 words.`;

function parseReport(text) {
  const clean = (text || '').replace(/\*\*/g, '').trim();

  const summaryMatch = clean.match(/SUMMARY:\s*([\s\S]*?)(?=\n\s*FINDINGS:|\n\s*RECOMMENDATION:|$)/i);
  const findingsMatch = clean.match(/FINDINGS:\s*([\s\S]*?)(?=\n\s*RECOMMENDATION:|$)/i);
  const recommendationMatch = clean.match(/RECOMMENDATION:\s*([\s\S]*)$/i);

  const summary = summaryMatch ? summaryMatch[1].trim() : '';
  const recommendation = recommendationMatch ? recommendationMatch[1].trim() : '';
  const findings = findingsMatch
    ? findingsMatch[1]
        .split('\n')
        .map((line) => line.replace(/^[\s\-*•]+/, '').trim())
        .filter(Boolean)
    : [];

  // Model didn't follow the structure — fall back to showing everything as the summary.
  if (!summary && findings.length === 0 && !recommendation) {
    return { summary: clean, findings: [], recommendation: '' };
  }

  return { summary, findings, recommendation };
}

function deriveRiskLevel(steps) {
  const herdStep = steps.find((s) => s.tool === 'get_herd_record' && s.result?.risk);
  return herdStep ? herdStep.result.risk : null;
}

export async function investigate(farmName) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Investigate the current biosecurity risk status for "${farmName}".` },
  ];

  const steps = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      messages,
      tools: toolDefinitions,
      tool_choice: 'auto',
      temperature: 0.2,
    });

    const message = completion.choices[0].message;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return {
        farmName,
        steps,
        riskLevel: deriveRiskLevel(steps),
        report: parseReport(message.content),
      };
    }

    for (const toolCall of message.tool_calls) {
      const { name } = toolCall.function;
      let args = {};
      try {
        args = JSON.parse(toolCall.function.arguments || '{}');
      } catch {
        args = {};
      }

      const impl = toolImplementations[name];
      const result = impl ? impl(args) : { error: `Unknown tool: ${name}` };

      steps.push({ tool: name, args, result });

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    farmName,
    steps,
    riskLevel: deriveRiskLevel(steps),
    report: {
      summary: 'The investigation used its maximum number of tool calls without reaching a conclusion. Try again or narrow the request.',
      findings: [],
      recommendation: '',
    },
  };
}
