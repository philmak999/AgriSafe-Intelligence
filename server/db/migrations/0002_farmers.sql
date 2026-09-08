CREATE TABLE IF NOT EXISTS farmers (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  farm_name TEXT NOT NULL,
  farm_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'farmer',
  status TEXT NOT NULL DEFAULT 'pending_review',
  document_path TEXT,
  document_original_name TEXT,
  preferences JSONB NOT NULL DEFAULT '{"reminders": true, "weeklyReport": true}',
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  last_reminder_sent_at TIMESTAMPTZ,
  last_weekly_report_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS farmers_username_lower_idx ON farmers (LOWER(username));

-- isFarmClaimed()/getFarmerByFarm() filter on farm_name constantly.
CREATE INDEX IF NOT EXISTS farmers_farm_name_idx ON farmers (farm_name);
