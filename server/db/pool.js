import pg from 'pg';

// Local Docker Postgres has no TLS listener at all; Cloud SQL's public IP
// enforces SSL. One flag switches between them rather than sniffing
// NODE_ENV, so a locally-run "production-like" test doesn't try (and fail)
// to negotiate TLS against the dev container.
const useSsl = process.env.DATABASE_SSL === 'true';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

export function query(text, params) {
  return pool.query(text, params);
}
