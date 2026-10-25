import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // `npm start` serves the production build (used by Render); any host name is allowed.
  preview: { host: true, allowedHosts: true },
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
});
