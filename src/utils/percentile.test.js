import { describe, it, expect } from 'vitest';
import { computeMriPercentile, percentileLabel } from './percentile.js';

describe('computeMriPercentile', () => {
  it('returns null for an unknown farm', () => {
    expect(computeMriPercentile('Not A Real Farm')).toBeNull();
  });

  it('ranks a top-scoring farm near the top', () => {
    // mri 79 — tied for highest with Buffalo Export Facility, so it doesn't
    // outperform that one farm and lands just under the 100th percentile.
    const percentile = computeMriPercentile('Halton Heritage Farm');
    expect(percentile).toBe(86);
  });

  it('ranks the lowest-scoring farm at the bottom', () => {
    const percentile = computeMriPercentile('Thornfield Beef Co.'); // mri 28, lowest in mock data
    expect(percentile).toBe(0);
  });
});

describe('percentileLabel', () => {
  it('handles the null (not enough data) case', () => {
    expect(percentileLabel(null)).toBe('Not enough data to compare');
  });

  it.each([
    [95, 'Top 10% of the corridor'],
    [80, 'Top quarter of the corridor'],
    [60, 'Above the corridor median'],
    [30, 'Below the corridor median'],
    [10, 'Bottom quarter of the corridor'],
  ])('labels percentile %i as "%s"', (percentile, expected) => {
    expect(percentileLabel(percentile)).toBe(expected);
  });
});
