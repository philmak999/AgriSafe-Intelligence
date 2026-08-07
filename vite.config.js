import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this project from /AgriSafe-Intelligence/, not the domain
// root — every asset path in the built index.html needs that prefix, or they
// all 404 and the page renders blank. Gated behind an explicit env var (set
// only by the GitHub Pages deploy workflow) rather than `command === 'build'`,
// which would also wrongly apply the prefix to a local `vite preview`.
const isGhPagesBuild = process.env.GH_PAGES === 'true';

export default defineConfig({
  base: isGhPagesBuild ? '/AgriSafe-Intelligence/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
