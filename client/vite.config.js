import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('../server', import.meta.url)), '');
  return { plugins: [react()], server: { host: '127.0.0.1', port: 5173, strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:' + (env.PORT || 5000), changeOrigin: true } } } };
});
