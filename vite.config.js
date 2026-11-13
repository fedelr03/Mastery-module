import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Libraries go in their own files: they rarely change, so returning visitors
        // keep them cached when only the app's code is updated.
        manualChunks(id) {
          if (id.includes('node_modules/@supabase') ) return 'supabase';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
        },
      },
    },
  },
});
