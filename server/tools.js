import { herds, riskTimelineEvents, inspectionHistory, complianceReports } from '../src/data/mockData.js';

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
};
