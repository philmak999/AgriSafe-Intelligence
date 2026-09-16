import { herds } from '../src/data/mockData.js';
import { getLatestApprovedSuggestion } from './documentStore.js';

// Sub-index definitions. `invert: true` means a higher raw value is *worse*
// (its contribution to the composite score is 100 - raw) — same convention
// the old hardcoded FACTORS array in MRIModelConfig.jsx used.
export const FACTORS = [
  { key: 'vaccination', label: 'Vaccination coverage', color: '#1D9E75', invert: false },
  { key: 'antibiotic', label: 'Antibiotic compliance', color: '#639922', invert: false },
  { key: 'herdDensity', label: 'Herd density risk', color: '#EF9F27', invert: true },
  { key: 'outbreakProximity', label: 'Outbreak proximity', color: '#E24B4A', invert: true },
];

// herdDensity/outbreakProximity aren't things a single uploaded document
// naturally reports — they stay regional/background inputs derived from the
// existing farm registry, not inspector- or document-editable, per the
// biosecurity critique that not everything should be a slider *or* a scan.
const RISK_PROXIMITY_PROXY = { HIGH: 80, MED: 50, LOW: 20 };

function regionalDefault(herd, key) {
  if (!herd) return 50;
  if (key === 'vaccination') return herd.vaccination;
  if (key === 'antibiotic') return 75; // neutral default until a lab result is on file
  if (key === 'herdDensity') {
    const counts = herds.map((h) => h.headCount);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    return max === min ? 50 : Math.round(((herd.headCount - min) / (max - min)) * 100);
  }
  if (key === 'outbreakProximity') return RISK_PROXIMITY_PROXY[herd.risk] ?? 50;
  return 50;
}

// The evidence-driven replacement for the old sliders: vaccination/antibiotic
// sub-indexes come from the most recent scientist-approved document
// suggestion for that farm, falling back to registry/regional data when
// nothing's been uploaded and approved yet.
export async function getFarmSubIndexes(farmName) {
  const herd = herds.find((h) => h.farm === farmName);

  return Promise.all(
    FACTORS.map(async (factor) => {
      if (factor.key === 'vaccination' || factor.key === 'antibiotic') {
        const doc = await getLatestApprovedSuggestion(farmName, factor.key);
        if (doc) {
          return {
            ...factor,
            value: doc.suggestedSubindexValue,
            source: { documentId: doc.id, originalName: doc.originalName, uploadedAt: doc.createdAt, rationale: doc.suggestionRationale },
          };
        }
      }
      return { ...factor, value: regionalDefault(herd, factor.key), source: null };
    })
  );
}

export function computeComposite(subIndexes, weights) {
  const score = subIndexes.reduce((acc, s) => {
    const weightPct = weights[s.key] ?? 0;
    const contribution = s.invert ? 100 - s.value : s.value;
    return acc + (contribution * weightPct) / 100;
  }, 0);
  return Math.round(score);
}
