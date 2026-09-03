import { describe, it, expect } from 'vitest';
import { parseReport, deriveRiskLevel } from './agent.js';

describe('parseReport', () => {
  it('splits a well-formed report into summary/findings/recommendation', () => {
    const text = `SUMMARY:
Elevated risk following a herd density spike.

FINDINGS:
- MRI score fell to 28 (herd record)
- Two overdue inspections (inspection history)

RECOMMENDATION:
Schedule an inspection within 48 hours because the score is below the danger threshold.`;

    const report = parseReport(text);
    expect(report.summary).toBe('Elevated risk following a herd density spike.');
    expect(report.findings).toEqual([
      'MRI score fell to 28 (herd record)',
      'Two overdue inspections (inspection history)',
    ]);
    expect(report.recommendation).toBe(
      'Schedule an inspection within 48 hours because the score is below the danger threshold.'
    );
  });

  it('strips markdown bold markers', () => {
    const report = parseReport('SUMMARY:\n**High risk** farm.\n\nFINDINGS:\n- fact one\n\nRECOMMENDATION:\nEscalate.');
    expect(report.summary).toBe('High risk farm.');
  });

  it('falls back to raw text as summary when the model ignores the structure', () => {
    const report = parseReport('Everything looks fine, no concerns.');
    expect(report.summary).toBe('Everything looks fine, no concerns.');
    expect(report.findings).toEqual([]);
    expect(report.recommendation).toBe('');
  });

  it('handles empty/undefined input without throwing', () => {
    expect(parseReport('')).toEqual({ summary: '', findings: [], recommendation: '' });
    expect(parseReport(undefined)).toEqual({ summary: '', findings: [], recommendation: '' });
  });
});

describe('deriveRiskLevel', () => {
  it('reads the risk level off the herd record tool step', () => {
    const steps = [
      { tool: 'get_inspection_history', result: {} },
      { tool: 'get_herd_record', result: { risk: 'HIGH' } },
    ];
    expect(deriveRiskLevel(steps)).toBe('HIGH');
  });

  it('returns null when no herd record step was called', () => {
    expect(deriveRiskLevel([{ tool: 'get_compliance_status', result: {} }])).toBeNull();
  });

  it('returns null when the herd record step has no risk field', () => {
    expect(deriveRiskLevel([{ tool: 'get_herd_record', result: {} }])).toBeNull();
  });
});
