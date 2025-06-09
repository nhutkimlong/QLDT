import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      nodePolyfills({
        include: ['buffer', 'crypto', 'stream', 'util', 'url', 'fs', 'path', 'os', 'events'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        protocolImports: true,
      }),
    ],
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        external: ['fs', 'path', 'os', 'events', 'child_process', 'net', 'tls', 'http', 'https', 'zlib', 'http2', 'querystring', 'vm'],
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['antd', '@ant-design/icons', '@heroicons/react'],
            'pdf-vendor': ['pdf-parse', 'pdf-lib', 'pdf-poppler'],
            'google-vendor': ['@google/genai', 'googleapis'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    resolve: {
      alias: {
        'pdf-parse': 'pdf-parse/lib/pdf-parse.js',
      },
    },
    optimizeDeps: {
      exclude: ['pdf-parse', 'mammoth', 'tesseract.js', 'sharp', 'googleapis'],
      include: ['react', 'react-dom', 'react-router-dom', 'antd', '@ant-design/icons'],
    },
    define: {
      'process.env': env
    }
  };
});
