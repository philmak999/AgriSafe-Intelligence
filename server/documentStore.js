import { pool } from './db/pool.js';

export const DOCUMENT_CATEGORIES = [
  'vaccination_certificate',
  'lab_result',
  'compliance_filing',
  'inspection_evidence',
  'other',
];

// Categories the AI is allowed to propose an MRI sub-index change for —
// keeps e.g. "other"/compliance filings from silently nudging a score.
export const CATEGORY_SUBINDEX_MAP = {
  vaccination_certificate: 'vaccination',
  lab_result: 'antibiotic',
};

// Every column except file_data (bytea, up to 10MB) — list/lookup queries
// use this so a table of documents doesn't pull every file's bytes just to
// render. getDocumentFile() is the only function that selects file_data.
const LIST_COLUMNS = `
  id, farm_name, category, original_name, mimetype, uploaded_by_id, uploaded_by_name,
  uploaded_by_role, note, extracted_text, ai_summary, ai_processed_at, suggested_subindex_key,
  suggested_subindex_value, suggestion_rationale, suggestion_status, inspection_id, created_at
`;

function toDocument(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmName: row.farm_name,
    category: row.category,
    originalName: row.original_name,
    mimetype: row.mimetype,
    uploadedById: row.uploaded_by_id,
    uploadedByName: row.uploaded_by_name,
    uploadedByRole: row.uploaded_by_role,
    note: row.note,
    extractedText: row.extracted_text,
    aiSummary: row.ai_summary,
    aiProcessedAt: row.ai_processed_at,
    suggestedSubindexKey: row.suggested_subindex_key,
    suggestedSubindexValue: row.suggested_subindex_value,
    suggestionRationale: row.suggestion_rationale,
    suggestionStatus: row.suggestion_status,
    inspectionId: row.inspection_id,
    createdAt: row.created_at,
  };
}

export async function createDocument({
  farmName,
  category,
  fileData,
  originalName,
  mimetype,
  uploadedById,
  uploadedByName,
  uploadedByRole,
  note,
  inspectionId,
}) {
  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { rows } = await pool.query(
    `INSERT INTO documents
       (id, farm_name, category, file_data, original_name, mimetype, uploaded_by_id, uploaded_by_name, uploaded_by_role, note, inspection_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING ${LIST_COLUMNS}`,
    [id, farmName, category, fileData, originalName, mimetype, uploadedById, uploadedByName, uploadedByRole, note || null, inspectionId || null]
  );

  return toDocument(rows[0]);
}

export async function attachAiResult(id, { extractedText, summary, subIndexKey, suggestedValue, rationale }) {
  const status = subIndexKey ? 'pending' : 'none';
  const { rows } = await pool.query(
    `UPDATE documents
     SET extracted_text = $2, ai_summary = $3, ai_processed_at = now(),
         suggested_subindex_key = $4, suggested_subindex_value = $5, suggestion_rationale = $6,
         suggestion_status = $7
     WHERE id = $1
     RETURNING ${LIST_COLUMNS}`,
    [id, extractedText || null, summary || null, subIndexKey || null, suggestedValue ?? null, rationale || null, status]
  );
  return toDocument(rows[0]);
}

export async function setSuggestionStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE documents SET suggestion_status = $2 WHERE id = $1 RETURNING ${LIST_COLUMNS}`,
    [id, status]
  );
  return toDocument(rows[0]);
}

export async function getDocumentsByFarm(farmName) {
  const { rows } = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM documents WHERE farm_name = $1 ORDER BY created_at DESC`,
    [farmName]
  );
  return rows.map(toDocument);
}

export async function getAllDocuments() {
  const { rows } = await pool.query(`SELECT ${LIST_COLUMNS} FROM documents ORDER BY created_at DESC`);
  return rows.map(toDocument);
}

export async function getDocumentById(id) {
  const { rows } = await pool.query(`SELECT ${LIST_COLUMNS} FROM documents WHERE id = $1`, [id]);
  return toDocument(rows[0]);
}

// Only function that reads the file bytes back out — used by the one route
// that actually serves the document.
export async function getDocumentFile(id) {
  const { rows } = await pool.query(
    'SELECT file_data, mimetype, original_name FROM documents WHERE id = $1',
    [id]
  );
  const row = rows[0];
  if (!row || !row.file_data) return null;
  return { data: row.file_data, mimetype: row.mimetype, originalName: row.original_name };
}

// Most recent *approved* AI suggestion per farm+sub-index — this is what
// MRIModelConfig reads as the "current, evidence-sourced" value for a farm,
// instead of a hand-set slider.
export async function getLatestApprovedSuggestion(farmName, subIndexKey) {
  const { rows } = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM documents
     WHERE farm_name = $1 AND suggested_subindex_key = $2 AND suggestion_status = 'approved'
     ORDER BY created_at DESC LIMIT 1`,
    [farmName, subIndexKey]
  );
  return toDocument(rows[0]);
}
