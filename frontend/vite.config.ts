import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for the React + TypeScript front end.
 *
 * Tutorial note:
 * - During development, `npm run dev` serves the app on port 5173.
 * - `/api` calls are proxied to Spring Boot (port 8080), so the UI can fetch
 *   backend data without CORS setup while developing.
 * - During `npm run build`, files are emitted into Spring's static directory,
 *   so the backend can serve the bundled SPA in production.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../src/main/resources/static',
    emptyOutDir: true,
  },
});
