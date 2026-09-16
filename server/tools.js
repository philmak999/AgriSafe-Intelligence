import { herds, riskTimelineEvents, inspectionHistory, complianceReports } from '../src/data/mockData.js';
import { getDocumentsByFarm } from './documentStore.js';
import { getInspectionsByFarm } from './inspectionStore.js';

function matches(value, query) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'get_herd_record',
      description: 'Look up a herd/farm registry record: species, head count, vaccination rate, MRI score, and current risk level.',
      parameters: {
        type: 'object',
        properties: {
          farmName: { type: 'string', description: 'Farm or herd name, e.g. "Thornfield Beef Co."' },
        },
        required: ['farmName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_risk_timeline',
      description: 'Get recent biosecurity risk events recorded for a farm, most recent first.',
      parameters: {
        type: 'object',
        properties: {
          farmName: { type: 'string', description: 'Farm name to filter risk events for' },
        },
        required: ['farmName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_inspection_history',
      description: 'Get inspection history records for a facility or farm, including pathogen screens and pass/fail status.',
      parameters: {
        type: 'object',
        properties: {
          facility: { type: 'string', description: 'Facility or farm name to filter inspections for' },
        },
        required: ['facility'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_compliance_status',
      description: 'Get regulatory compliance filings (FSMA, CFIA, USDA FSIS) for a facility.',
      parameters: {
        type: 'object',
        properties: {
          facility: { type: 'string', description: 'Facility or farm name to filter compliance reports for' },
        },
        required: ['facility'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_farm_documents',
      description: 'Get real uploaded evidence documents for a farm (vaccination certificates, lab results, compliance filings) with their AI-extracted summaries — this is actual submitted evidence, not a mock record.',
      parameters: {
        type: 'object',
        properties: {
          farmName: { type: 'string', description: 'Farm name to look up uploaded documents for' },
        },
        required: ['farmName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_farm_inspections',
      description: 'Get real inspector-submitted biosecurity checklist inspections for a farm (perimeter control, PPE, pest control, etc.), including pass/fail per item and corrective actions.',
      parameters: {
        type: 'object',
        properties: {
          farmName: { type: 'string', description: 'Farm name to look up inspection checklist history for' },
        },
        required: ['farmName'],
      },
    },
  },
];

export const toolImplementations = {
  get_herd_record: ({ farmName }) => {
    const record = herds.find((h) => matches(h.farm, farmName));
    return record || { found: false, message: `No herd registry record found for "${farmName}".` };
  },
  get_risk_timeline: ({ farmName }) => {
    const events = riskTimelineEvents.filter((e) => matches(e.farm, farmName));
    return events.length ? events : { found: false, message: `No risk timeline events found for "${farmName}".` };
  },
  get_inspection_history: ({ facility }) => {
    const records = inspectionHistory.filter((r) => matches(r.facility, facility));
    return records.length ? records : { found: false, message: `No inspection records found for "${facility}".` };
  },
  get_compliance_status: ({ facility }) => {
    const records = complianceReports.filter((r) => matches(r.facility, facility));
    return records.length ? records : { found: false, message: `No compliance filings found for "${facility}".` };
  },
  get_farm_documents: async ({ farmName }) => {
    const docs = await getDocumentsByFarm(farmName);
    if (!docs.length) return { found: false, message: `No uploaded documents found for "${farmName}".` };
    return docs.map((d) => ({
      category: d.category,
      uploadedBy: `${d.uploadedByName} (${d.uploadedByRole})`,
      note: d.note,
      aiSummary: d.aiSummary,
      suggestedSubindexKey: d.suggestedSubindexKey,
      suggestedSubindexValue: d.suggestedSubindexValue,
      suggestionStatus: d.suggestionStatus,
      uploadedAt: d.createdAt,
    }));
  },
  get_farm_inspections: async ({ farmName }) => {
    const inspections = await getInspectionsByFarm(farmName);
    if (!inspections.length) return { found: false, message: `No inspection checklists found for "${farmName}".` };
    return inspections.map((i) => ({
      inspector: i.inspectorName,
      performedAt: i.performedAt,
      overallResult: i.overallResult,
      passedCount: i.passedCount,
      failedCount: i.failedCount,
      failedItems: i.checklist.filter((c) => c.result === 'fail').map((c) => c.label),
      correctiveActions: i.correctiveActions,
    }));
  },
};
