// @ts-check
import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

const layers = ['shared', 'entities', 'features', 'widgets', 'screens', 'app'];

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'ios/**',
      'android/**',
      '**/*.test.ts',
      '**/__fixtures__/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': layers.map((layer) => ({
        type: layer,
        pattern: `src/${layer}/**/*`,
      })),
      'boundaries/ignore': ['**/*.test.ts', '**/*.test.tsx'],
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: ['shared'], allow: ['shared'] },
            { from: ['entities'], allow: ['shared', 'entities'] },
            { from: ['features'], allow: ['shared', 'entities'] },
            { from: ['widgets'], allow: ['shared', 'entities', 'features', 'widgets'] },
            { from: ['screens'], allow: ['shared', 'entities', 'features', 'widgets', 'screens'] },
            {
              from: ['app'],
              allow: ['shared', 'entities', 'features', 'widgets', 'screens', 'app'],
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/src-v2/*', '@/src-v2/*'],
              message: 'Use src/ layer imports (@/app, @/entities, …).',
            },
            {
              group: [
                '@/entities/*/ui/*',
                '@/entities/*/lib/*',
                '@/entities/*/api/*',
                '@/entities/*/model/*',
              ],
              message: 'Import entities only through public API: @/entities/<name>',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
