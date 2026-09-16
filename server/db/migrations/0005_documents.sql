-- Central cross-collaborative evidence surface. Any role (farmer, inspector,
-- scientist) can upload here; category + inspection_id distinguish a
-- standalone farmer upload (vaccination cert, lab result, ...) from
-- inspector-attached evidence tied to a specific inspections row.
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  farm_name TEXT NOT NULL,
  category TEXT NOT NULL,
  gcs_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mimetype TEXT NOT NULL,
  uploaded_by_id TEXT NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  uploaded_by_role TEXT NOT NULL,
  note TEXT,
  extracted_text TEXT,
  ai_summary TEXT,
  ai_processed_at TIMESTAMPTZ,
  suggested_subindex_key TEXT,
  suggested_subindex_value INTEGER,
  suggestion_rationale TEXT,
  suggestion_status TEXT NOT NULL DEFAULT 'none',
  inspection_id TEXT REFERENCES inspections (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_farm_name_idx ON documents (farm_name);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents (created_at DESC);
CREATE INDEX IF NOT EXISTS documents_inspection_id_idx ON documents (inspection_id);
