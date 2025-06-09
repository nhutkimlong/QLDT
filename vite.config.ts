import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['fs', 'path', 'crypto', 'stream', 'util', 'buffer', 'url'],
    },
  },
  resolve: {
    alias: {
      fs: 'browserify-fs',
      path: 'path-browserify',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      util: 'util',
      buffer: 'buffer',
      url: 'url',
    },
  },
  optimizeDeps: {
    exclude: ['pdf-parse', 'mammoth', 'tesseract.js', 'sharp'],
  },
});
