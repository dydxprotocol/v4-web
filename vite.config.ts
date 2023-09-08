import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    'process.env': {},
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: 'public', replacement: path.resolve(__dirname, 'public') },
      {
        find: 'stream',
        replacement: 'stream-browserify',
      },
      {
        find: 'assert',
        replacement: 'assert',
      },
      {
        find: 'url',
        replacement: 'url-polyfill',
      },
      {
        find: 'util',
        replacement: 'util/',
      },
      {
        find: 'zlib',
        replacement: 'browserify-zlib',
      },
    ],
  },
  plugins: [
    react({
      babel: {
        plugins: [
          [
            'babel-plugin-styled-components',
            {
              displayName: mode === 'development',
            },
          ],
        ],
      },
    }),
    svgr({
      exportAsDefault: true,
    }),
  ],
  publicDir: 'public',
}));
