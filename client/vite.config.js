/**
 * @file vite.config.js
 * @module ViteConfig
 *
 * @description
 * Vite build tool configuration for the Rentify client application. Configures the
 * React plugin for JSX transformation and Fast Refresh. Sets up a development proxy
 * to forward /api requests to the backend Express server running on port 5000,
 * eliminating CORS issues during local development. Also configures Vitest as the
 * test runner with jsdom environment for React component testing.
 *
 * @dependencies
 * - @vitejs/plugin-react: Vite plugin for React JSX and Fast Refresh support
 * - vitest: Test runner configuration integrated via Vite config
 *
 * @exports
 * - default: Vite configuration object
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    css: true,
  },
});
