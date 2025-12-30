import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const external = ['graphql', 'graphql-request', 'zod', '@reduxjs/toolkit', 'immer', 'lodash'];

export default [
  // JS build
  {
    input: {
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
        entries: [
          { find: '@', replacement: path.resolve(__dirname, 'src') }
        ]
      }),
      resolve({ extensions: ['.ts', '.js'] }),
      esbuild({
        target: 'esnext',
        tsconfig: './tsconfig.build.json',
      }),
    ],
  },
  // DTS build
  {
    input: {
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
