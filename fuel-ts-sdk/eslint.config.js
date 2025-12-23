import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import baseConfig from '../eslint.config.base.js';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'src/generated'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // No globals - this is an isomorphic library (works in browser + Node)
    },
    rules: {
      ...baseConfig.rules,
      'no-console': 'error', 
    },
  }
);