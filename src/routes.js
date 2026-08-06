export const ROUTES = {
  dashboard: '/',
  riskTimeline: '/risk-timeline',
  herdRecords: '/herd-records',
  inspectionLog: '/inspection-log',
  complianceReports: '/compliance-reports',
  mriModel: '/mri-model',
  pathogenTrends: '/pathogen-trends',
};

export const ROUTE_META = {
  [ROUTES.dashboard]: {
    title: 'Biosecurity dashboard',
    subtitle: 'Region: Ontario + NYS corridor · Updated 09:14 EDT',
  },
  [ROUTES.riskTimeline]: {
    title: 'Risk timeline',
    subtitle: 'Chronological biosecurity risk events across the corridor',
  },
  [ROUTES.herdRecords]: {
    title: 'Herd records',
    subtitle: '148 herds monitored across Ontario + NYS',
  },
  [ROUTES.inspectionLog]: {
    title: 'Inspection log',
    subtitle: 'Full facility inspection history · NYS corridor',
  },
  [ROUTES.complianceReports]: {
    title: 'Compliance reports',
    subtitle: 'Regulatory filings & audit status',
  },
  [ROUTES.mriModel]: {
    title: 'MRI model configuration',
    subtitle: 'Tune sub-index weights for the Biosecurity Index',
  },
  [ROUTES.pathogenTrends]: {
    title: 'Pathogen trends',
    subtitle: 'Detection trends across NYS processing facilities',
  },
};
