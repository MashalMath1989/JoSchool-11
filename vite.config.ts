import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'react': path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        },
        dedupe: ['react', 'react-dom']
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime']
      },
      build: {
        target: 'esnext',
        cssCodeSplit: true,
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2pdf.js') || id.includes('node_modules/html-to-image')) {
                return 'vendor-pdf-export';
              }
              if (id.includes('node_modules/recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('node_modules/katex')) {
                return 'vendor-katex';
              }
              if (id.includes('node_modules/firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('node_modules/framer-motion')) {
                return 'vendor-framer-motion';
              }
              if (id.includes('node_modules/lucide-react')) {
                return 'vendor-icons';
              }
            }
          }
        }
      }
    };
});
