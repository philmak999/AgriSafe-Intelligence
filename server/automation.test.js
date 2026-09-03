import { describe, it, expect } from 'vitest';
import { riskFlags } from '../src/data/mockData.js';
import { sourceCandidates, needsReview } from './automation.js';

describe('sourceCandidates', () => {
  it('only sources HIGH and MED risk flags, mapped to farmName/riskLevel', () => {
    const candidates = sourceCandidates();
    const expectedFlags = riskFlags.filter((f) => f.risk === 'HIGH' || f.risk === 'MED');

    expect(candidates).toHaveLength(expectedFlags.length);
    expect(candidates.length).toBeGreaterThan(0);
    for (const candidate of candidates) {
      expect(['HIGH', 'MED']).toContain(candidate.riskLevel);
      expect(typeof candidate.farmName).toBe('string');
      expect(candidate.farmName.length).toBeGreaterThan(0);
      expect(candidate.sourceReason).toContain(candidate.riskLevel);
    }
  });

  it('excludes LOW risk flags', () => {
    const candidates = sourceCandidates();
    const lowFarms = riskFlags.filter((f) => f.risk === 'LOW').map((f) => f.farm);
    for (const candidate of candidates) {
      expect(lowFarms).not.toContain(candidate.farmName);
    }
  });
});

describe('needsReview', () => {
  it('returns true when there is no existing record', () => {
    expect(needsReview(undefined)).toBe(true);
    expect(needsReview(null)).toBe(true);
  });

  it('returns true when the existing record has never been reviewed', () => {
    expect(needsReview({ lastReviewedAt: null })).toBe(true);
  });

  it('returns false when reviewed recently', () => {
    expect(needsReview({ lastReviewedAt: new Date().toISOString() })).toBe(false);
  });

  it('returns true when the review is older than the review interval', () => {
    const longAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(needsReview({ lastReviewedAt: longAgo })).toBe(true);
  });
});
