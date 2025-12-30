import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    client: 'src/client.ts',
    'trading/index': 'src/trading/index.ts',
  },
  format: ['esm'],
  dts: {
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['graphql', 'graphql-request', 'zod'],
  tsconfig: './tsconfig.build.json',
});
