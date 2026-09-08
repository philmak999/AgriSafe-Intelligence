CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'scientist',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness — logins/registration checks compare usernames
-- case-insensitively, so two accounts differing only by case must be rejected too.
CREATE UNIQUE INDEX IF NOT EXISTS staff_username_lower_idx ON staff (LOWER(username));
