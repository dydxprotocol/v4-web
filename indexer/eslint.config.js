import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import baseConfig from '../eslint.config.base.js';

export default tseslint.config(
  {
    ignores: ['lib', 'dist', 'node_modules', 'src/model/generated'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      ...baseConfig.rules,
      // Node.js specific
      'no-console': 'off', // Console logging is fine in backend services
    },
  }
);
