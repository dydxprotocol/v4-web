// Root ESLint config for monorepo
// Each package has its own eslint.config.js with environment-specific rules

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/lib/**',
      '**/.next/**',
      '**/coverage/**',
      '**/generated/**',
      '*.min.js',
      'pnpm-lock.yaml',
    ],
  },
];
