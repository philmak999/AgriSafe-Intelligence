import { herds } from '../data/mockData';

// Percentile = share of OTHER farms this farm's MRI score outperforms.
// Deliberately vague — enough to compare without naming or ranking specific farms.
export function computeMriPercentile(farmName) {
  const farm = herds.find((h) => h.farm === farmName);
  if (!farm) return null;

  const others = herds.filter((h) => h.farm !== farmName);
  if (others.length === 0) return null;

  const outperformed = others.filter((h) => h.mri < farm.mri).length;
  return Math.round((outperformed / others.length) * 100);
}

export function percentileLabel(percentile) {
  if (percentile === null) return 'Not enough data to compare';
  if (percentile >= 90) return 'Top 10% of the corridor';
  if (percentile >= 75) return 'Top quarter of the corridor';
  if (percentile >= 50) return 'Above the corridor median';
  if (percentile >= 25) return 'Below the corridor median';
  return 'Bottom quarter of the corridor';
}
