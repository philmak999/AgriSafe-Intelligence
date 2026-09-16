-- Backs the live cross-role activity feed (server/activityBus.js + the
-- /api/activity SSE stream) so an inspector/scientist sees a farmer's
-- upload, or a submitted inspection, without refreshing.
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  farm_name TEXT,
  actor_name TEXT,
  actor_role TEXT,
  summary TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON activity_log (created_at DESC);
