// Mock "current" dates are anchored to real time (not the fictional Mar 2026
// timeline the rest of the dashboard uses) so reminder/report emails always
// have a realistic mix of overdue, due-soon, and upcoming items to reference.
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const herds = [
  { id: 'ON-0142', farm: 'Thornfield Beef Co.', location: 'Elora, ON', species: 'Bovine', headCount: 840, vaccination: 78, lastInspection: 'Mar 27', mri: 28, risk: 'HIGH', nextInspectionDue: daysFromNow(-5) },
  { id: 'NY-0311', farm: 'Maple Ridge Pork', location: 'Batavia, NYS', species: 'Swine', headCount: 1200, vaccination: 81, lastInspection: 'Mar 26', mri: 33, risk: 'HIGH', nextInspectionDue: daysFromNow(3) },
  { id: 'ON-0087', farm: 'Lakeshore Dairy', location: 'Brampton, ON', species: 'Bovine', headCount: 320, vaccination: 88, lastInspection: 'Mar 22', mri: 51, risk: 'MED', nextInspectionDue: daysFromNow(20) },
  { id: 'NY-0455', farm: 'Seneca Valley Farms', location: 'Geneva, NYS', species: 'Poultry', headCount: 4500, vaccination: 84, lastInspection: 'Mar 24', mri: 48, risk: 'MED', nextInspectionDue: daysFromNow(45) },
  { id: 'ON-0203', farm: 'Halton Heritage Farm', location: 'Milton, ON', species: 'Bovine', headCount: 180, vaccination: 95, lastInspection: 'Mar 12', mri: 79, risk: 'LOW', nextInspectionDue: daysFromNow(60) },
  { id: 'NY-0128', farm: 'Rochester Cold Storage', location: 'Rochester, NYS', species: 'Bovine', headCount: 610, vaccination: 91, lastInspection: 'Mar 24', mri: 71, risk: 'LOW', nextInspectionDue: daysFromNow(75) },
  { id: 'NY-0067', farm: 'Buffalo Export Facility', location: 'Buffalo, NYS', species: 'Poultry', headCount: 2100, vaccination: 93, lastInspection: 'Mar 23', mri: 79, risk: 'LOW', nextInspectionDue: daysFromNow(80) },
  { id: 'ON-0055', farm: 'Elmvale Sheep Co.', location: 'Elmvale, ON', species: 'Ovine', headCount: 260, vaccination: 87, lastInspection: 'Mar 15', mri: 66, risk: 'LOW', nextInspectionDue: daysFromNow(90) },
];

export const riskFlags = [
  { farm: 'Thornfield Beef Co.', location: 'Elora, ON', type: 'Bovine', headCount: '840 head', risk: 'HIGH', score: 28 },
  { farm: 'Maple Ridge Pork', location: 'Batavia, NYS', type: 'Swine', headCount: '1200 head', risk: 'HIGH', score: 33 },
  { farm: 'Lakeshore Dairy', location: 'Brampton, ON', type: 'Bovine', headCount: '320 head', risk: 'MED', score: 51 },
  { farm: 'Seneca Valley Farms', location: 'Geneva, NYS', type: 'Poultry', headCount: '4500 head', risk: 'MED', score: 48 },
  { farm: 'Halton Heritage Farm', location: 'Milton, ON', type: 'Bovine', headCount: '180 head', risk: 'LOW', score: 79 },
];

export const riskTimelineEvents = [
  { date: 'Mar 27', farm: 'Thornfield Beef Co.', severity: 'HIGH', description: 'MRI score fell to 28 — below the 30-point danger threshold following a herd density spike.' },
  { date: 'Mar 26', farm: 'Maple Ridge Pork', severity: 'HIGH', description: 'Outbreak proximity sub-index flagged after a confirmed case within 15km.' },
  { date: 'Mar 24', farm: 'Seneca Valley Farms', severity: 'MED', description: 'Antibiotic compliance dipped to 71% — scheduled for re-audit next cycle.' },
  { date: 'Mar 22', farm: 'Lakeshore Dairy', severity: 'MED', description: 'Vaccination coverage renewal overdue by 9 days; producer notified.' },
  { date: 'Mar 18', farm: 'Thornfield Beef Co.', severity: 'HIGH', description: 'Escalated to HIGH risk after two consecutive weekly MRI declines.' },
  { date: 'Mar 12', farm: 'Halton Heritage Farm', severity: 'LOW', description: 'Full biosecurity review completed — score improved to 79.' },
  { date: 'Mar 05', farm: 'Maple Ridge Pork', severity: 'MED', description: 'Herd density risk sub-index crossed into moderate range after expansion.' },
  { date: 'Feb 26', farm: 'Seneca Valley Farms', severity: 'LOW', description: 'Quarterly inspection passed with no corrective actions required.' },
];

export const inspectionHistory = [
  { facility: 'Albany Meat Processing', date: 'Mar 27', inspector: 'K. Nolan', pathogen: 'E. coli, Salmonella', status: 'PASS' },
  { facility: 'Syracuse Packing Co.', date: 'Mar 26', inspector: 'M. Devereux', pathogen: 'Listeria screen', status: 'REVIEW' },
  { facility: 'Batavia Poultry Plant', date: 'Mar 25', inspector: 'K. Nolan', pathogen: 'Campylobacter', status: 'FAIL' },
  { facility: 'Rochester Cold Storage', date: 'Mar 24', inspector: 'T. Osei', pathogen: 'Full audit', status: 'PASS' },
  { facility: 'Buffalo Export Facility', date: 'Mar 23', inspector: 'M. Devereux', pathogen: 'Salmonella', status: 'PASS' },
  { facility: 'Seneca Valley Farms', date: 'Mar 21', inspector: 'T. Osei', pathogen: 'Avian influenza screen', status: 'PASS' },
  { facility: 'Batavia Poultry Plant', date: 'Mar 11', inspector: 'K. Nolan', pathogen: 'Campylobacter', status: 'REVIEW' },
  { facility: 'Albany Meat Processing', date: 'Feb 28', inspector: 'M. Devereux', pathogen: 'E. coli screen', status: 'PASS' },
  { facility: 'Syracuse Packing Co.', date: 'Feb 14', inspector: 'T. Osei', pathogen: 'Listeria screen', status: 'PASS' },
];

export const complianceReports = [
  { id: 'CR-2026-014', facility: 'Albany Meat Processing', regulation: 'FSMA 204', period: 'Q1 2026', filed: 'Mar 28', status: 'PASS', label: 'Compliant' },
  { id: 'CR-2026-013', facility: 'Syracuse Packing Co.', regulation: 'CFIA Part 11', period: 'Q1 2026', filed: 'Mar 27', status: 'REVIEW', label: 'Pending', dueDate: daysFromNow(10) },
  { id: 'CR-2026-012', facility: 'Batavia Poultry Plant', regulation: 'FSMA 204', period: 'Q1 2026', filed: 'Mar 25', status: 'FAIL', label: 'Non-Compliant' },
  { id: 'CR-2026-011', facility: 'Rochester Cold Storage', regulation: 'USDA FSIS', period: 'Q1 2026', filed: 'Mar 24', status: 'PASS', label: 'Compliant' },
  { id: 'CR-2026-010', facility: 'Buffalo Export Facility', regulation: 'CFIA Part 11', period: 'Q1 2026', filed: 'Mar 23', status: 'PASS', label: 'Compliant' },
  { id: 'CR-2026-009', facility: 'Seneca Valley Farms', regulation: 'USDA FSIS', period: 'Q4 2025', filed: 'Jan 09', status: 'PASS', label: 'Compliant' },
  { id: 'CR-2026-008', facility: 'Maple Ridge Pork', regulation: 'FSMA 204', period: 'Q4 2025', filed: 'Jan 06', status: 'REVIEW', label: 'Pending', dueDate: daysFromNow(-8) },
];
