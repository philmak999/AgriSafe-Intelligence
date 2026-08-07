// In local dev this is empty, so `${API_BASE}/api/...` stays a relative path
// and goes through Vite's dev proxy (see vite.config.js). In the GitHub Pages
// build, VITE_API_BASE_URL is baked in at build time (see the deploy workflow)
// to point at the deployed backend, since Pages can't proxy or run a server.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
