import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/backgrounds': {
        target: 'http://localhost:8000',
        changeOrigin: true, // Recommended for virtual hosts
      },
      // '/api': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, ''), // Optional: remove /api prefix
      // }
    },
  },
  build: {
    minify: false,
    sourcemap: true,
  },
});
