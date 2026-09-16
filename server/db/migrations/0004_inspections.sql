-- Real farm-level biosecurity inspections (distinct from the mock
-- processing-facility inspectionHistory in src/data/mockData.js). Each row
-- is one inspector's visit to one farm, with a structured per-item
-- checklist rather than a single pass/fail status.
CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  farm_name TEXT NOT NULL,
  inspector_id TEXT NOT NULL,
  inspector_name TEXT NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checklist JSONB NOT NULL,
  overall_result TEXT NOT NULL,
  passed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  corrective_actions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inspections_farm_name_idx ON inspections (farm_name);
CREATE INDEX IF NOT EXISTS inspections_performed_at_idx ON inspections (performed_at DESC);
