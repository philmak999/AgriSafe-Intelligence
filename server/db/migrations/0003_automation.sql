CREATE TABLE IF NOT EXISTS automation_records (
  id TEXT PRIMARY KEY,
  farm_name TEXT NOT NULL UNIQUE,
  status TEXT,
  risk_level TEXT,
  source_reason TEXT,
  investigation JSONB,
  notification JSONB,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_history (
  id SERIAL PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES automation_records (id) ON DELETE CASCADE,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event TEXT NOT NULL,
  detail TEXT
);

CREATE INDEX IF NOT EXISTS automation_history_record_id_idx ON automation_history (record_id);

CREATE TABLE IF NOT EXISTS automation_runs (
  id SERIAL PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sourced INTEGER NOT NULL DEFAULT 0,
  processed INTEGER NOT NULL DEFAULT 0,
  notified INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER
);
