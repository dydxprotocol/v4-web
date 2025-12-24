import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import baseConfig from '../eslint.config.base.js';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'src/generated', '**/*.test.ts'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
      // No globals - this is an isomorphic library (works in browser + Node)
    },
    rules: {
      ...baseConfig.rules,
      'no-console': 'error',
    },
  }
);
