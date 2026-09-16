-- Append-only methodology history: every weight/threshold change inserts a
-- new row (never UPDATEs) so who changed the risk-scoring methodology, when,
-- and why is permanently attributable. The most recent row is the active config.
CREATE TABLE IF NOT EXISTS mri_config (
  id SERIAL PRIMARY KEY,
  weights JSONB NOT NULL,
  alert_threshold INTEGER NOT NULL,
  changed_by_id TEXT,
  changed_by_name TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mri_config_created_at_idx ON mri_config (created_at DESC);
