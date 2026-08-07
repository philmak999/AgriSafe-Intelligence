export const ROUTES = {
  dashboard: '/',
  riskTimeline: '/risk-timeline',
  herdRecords: '/herd-records',
  inspectionLog: '/inspection-log',
  complianceReports: '/compliance-reports',
  mriModel: '/mri-model',
  pathogenTrends: '/pathogen-trends',
  automation: '/automation',
  farmerRegister: '/register',
  farmerApprovals: '/farmer-approvals',
  login: '/login',
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
  [ROUTES.automation]: {
    title: 'Automation log',
    subtitle: 'Autonomous sourcing, investigation & follow-up loop',
  },
  [ROUTES.farmerRegister]: {
    title: 'Register your farm',
    subtitle: 'Create a farmer account to receive reminders & weekly reports',
  },
  [ROUTES.farmerApprovals]: {
    title: 'Farmer approvals',
    subtitle: 'Review pending registrations & ownership documentation',
  },
  [ROUTES.login]: {
    title: 'Sign in',
    subtitle: 'AgriSafe Intelligence',
  },
};
