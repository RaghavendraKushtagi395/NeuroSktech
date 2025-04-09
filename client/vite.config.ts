import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// @ts-ignore
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [react(), eslint()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
