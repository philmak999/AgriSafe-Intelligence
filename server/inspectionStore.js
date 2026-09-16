import { pool } from './db/pool.js';

// Fixed real-world-style biosecurity checklist — matches how programs like
// APHIS/CFIA site assessments are actually structured (per-item pass/fail,
// not one aggregate status).
export const CHECKLIST_ITEMS = [
  { key: 'perimeterControl', label: 'Perimeter control (fencing, gates, restricted access signage)' },
  { key: 'disinfectionStations', label: 'Disinfection stations at entry/exit points' },
  { key: 'ppeCompliance', label: 'PPE compliance (boots, coveralls, handwashing)' },
  { key: 'mortalityManagement', label: 'Mortality/carcass management' },
  { key: 'pestControl', label: 'Rodent/pest control' },
  { key: 'visitorLogs', label: 'Visitor & vehicle logs' },
  { key: 'waterProtection', label: 'Water source protection' },
];

function toInspection(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmName: row.farm_name,
    inspectorId: row.inspector_id,
    inspectorName: row.inspector_name,
    performedAt: row.performed_at,
    checklist: row.checklist,
    overallResult: row.overall_result,
    passedCount: row.passed_count,
    failedCount: row.failed_count,
    correctiveActions: row.corrective_actions,
    createdAt: row.created_at,
  };
}

// Matches the PASS/REVIEW/FAIL convention already used by mockData's
// inspectionHistory/complianceReports and the .status-tag CSS classes.
function deriveOverallResult(checklist) {
  const failed = checklist.filter((c) => c.result === 'fail').length;
  const passed = checklist.filter((c) => c.result === 'pass').length;
  const overallResult = failed > 0 ? (failed >= 2 ? 'FAIL' : 'REVIEW') : 'PASS';
  return { overallResult, passed, failed };
}

export async function createInspection({ farmName, inspectorId, inspectorName, checklist, correctiveActions }) {
  const id = `insp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { overallResult, passed, failed } = deriveOverallResult(checklist);

  const { rows } = await pool.query(
    `INSERT INTO inspections
       (id, farm_name, inspector_id, inspector_name, checklist, overall_result, passed_count, failed_count, corrective_actions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [id, farmName, inspectorId, inspectorName, JSON.stringify(checklist), overallResult, passed, failed, JSON.stringify(correctiveActions || [])]
  );

  return toInspection(rows[0]);
}

export async function getInspectionsByFarm(farmName) {
  const { rows } = await pool.query(
    'SELECT * FROM inspections WHERE farm_name = $1 ORDER BY performed_at DESC',
    [farmName]
  );
  return rows.map(toInspection);
}

export async function getAllInspections() {
  const { rows } = await pool.query('SELECT * FROM inspections ORDER BY performed_at DESC');
  return rows.map(toInspection);
}

export async function getInspectionById(id) {
  const { rows } = await pool.query('SELECT * FROM inspections WHERE id = $1', [id]);
  return toInspection(rows[0]);
}
