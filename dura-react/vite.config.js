import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/search': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/api/search': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/search-status': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/api/search-status': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/ai-search': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/api/ai-search': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/api/potential-partners': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/api/potential-partners-test': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/api/current-partners': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/top-partners': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/stats': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/reset-history': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/company-details': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/company-research': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/history': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/save': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/remove': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/partners': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      '/scoring-criteria': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      },
      // Fallback to catch all other API routes
      '^/api/.*': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        secure: false
      }
    }
  }
});