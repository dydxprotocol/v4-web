import tailwindcss from '@tailwindcss/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { viteEnvs } from 'vite-envs';
import { cssTwTransformPlugin } from './plugins/css-tw-transform.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    viteEnvs({
      declarationFile: '.env.example',
    }),
    cssTwTransformPlugin(), // Must run first (before react plugin)
    vanillaExtractPlugin(),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      public: path.resolve(__dirname, './public'),
    },
  },
});
