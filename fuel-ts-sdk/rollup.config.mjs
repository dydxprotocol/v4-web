import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import path from 'path';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const external = [
  'graphql',
  'graphql-request',
  'zod',
  '@reduxjs/toolkit',
  'immer',
  'lodash',
  'fuels',
];

export default [
  // JS build
  {
    input: {
      index: 'src/index.ts',
      client: 'src/client.ts',
      'trading/index': 'src/trading/index.ts',
    },
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: true,
      preserveModules: false,
    },
    external,
    plugins: [
      alias({
        entries: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
      }),
      json(),
      resolve({ extensions: ['.ts', '.js', '.json'] }),
      esbuild({
        target: 'esnext',
        tsconfig: './tsconfig.build.json',
      }),
    ],
  },
  // DTS build
  {
    input: {
      index: 'src/index.ts',
      client: 'src/client.ts',
      'trading/index': 'src/trading/index.ts',
    },
    output: {
      dir: 'dist',
      format: 'es',
    },
    external,
    plugins: [resolve({ extensions: ['.ts', '.js'] }), dts({ tsconfig: './tsconfig.build.json' })],
  },
];
