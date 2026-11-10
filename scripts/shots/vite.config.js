/* Dev server for the screenshot harness: `npx vite --config scripts/shots/vite.config.js` */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: here('.'),
  plugins: [react()],
  resolve: { alias: [{ find: /^(\.\.?\/)+supabase$/, replacement: here('./mockSupabase.js') }] },
  server: { port: 5199, fs: { allow: [here('../..')] } },
  build: { target: 'es2022' },
  esbuild: { target: 'es2022' },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
});
