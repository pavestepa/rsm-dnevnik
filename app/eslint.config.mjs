// @ts-check
import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

const entitySlices = ['chat', 'contact', 'event', 'media', 'message', 'session', 'user'];
const featureSlices = [
  'add-new-contact',
  'add-user',
  'change-description',
  'change-group-chat-description',
  'change-group-chat-main-image',
  'change-main-image',
  'change-name',
  'change-role',
  'create-event',
  'create-new-group',
  'delete-event',
  'delete-group-chat',
  'delete-message-for-everyone',
  'delete-message-for-me',
  'edit-event',
  'find-contact',
  'find-from-search-text-bar',
  'go-to-chat',
  'kick-user',
  'open-chat',
  'pick-event-group',
  'refresh-session-user',
  'remove-contact',
  'send-message',
  'show-chat-data',
  'show-chats-list',
  'show-contacts-list',
  'show-diary-list',
  'show-event-detail',
  'sign-in-with-password',
  'sign-out',
  'stream-chat',
  'stream-chats-list',
  'sync-device-contacts',
];
const widgetSlices = [
  'chat-header',
  'chat-list',
  'contact-modals',
  'contact-picker',
  'diary-header-actions',
  'diary-list',
  'event-card',
  'event-chat-card',
  'event-file-list',
  'event-group-picker',
  'event-image-grid',
  'group-modals',
  'message-selection',
  'participant-menu',
  'profile-card',
  'search-bar',
  'user-search',
];

const entityTypes = entitySlices.map((slice) => `entity-${slice}`);
const featureTypes = featureSlices.map((slice) => `feature-${slice}`);
const widgetTypes = widgetSlices.map((slice) => `widget-${slice}`);

/** @type {import('eslint-plugin-boundaries').Settings} */
const boundaryElements = [
  { type: 'shared', pattern: 'src/shared/**/*' },
  { type: 'entities-root', pattern: 'src/entities/index.ts' },
  ...entitySlices.map((slice) => ({
    type: `entity-${slice}`,
    pattern: `src/entities/${slice}/**/*`,
  })),
  ...featureSlices.map((slice) => ({
    type: `feature-${slice}`,
    pattern: `src/features/${slice}/**/*`,
  })),
  ...widgetSlices.map((slice) => ({
    type: `widget-${slice}`,
    pattern: `src/widgets/${slice}/**/*`,
  })),
  { type: 'screens', pattern: 'src/screens/**/*' },
  { type: 'app', pattern: 'src/app/**/*' },
];

/** @type {import('eslint-plugin-boundaries').Rules} */
const boundaryRules = [
  { from: { type: 'shared' }, allow: { to: { type: ['shared'] } } },
  ...entitySlices.map((slice) => ({
    from: { type: `entity-${slice}` },
    allow: { to: { type: ['shared', `entity-${slice}`] } },
  })),
  {
    from: { type: 'entities-root' },
    allow: { to: { type: ['shared', ...entityTypes] } },
  },
  ...featureSlices.map((slice) => ({
    from: { type: `feature-${slice}` },
    allow: { to: { type: ['shared', ...entityTypes, `feature-${slice}`] } },
  })),
  ...widgetSlices.map((slice) => ({
    from: { type: `widget-${slice}` },
    allow: {
      to: { type: ['shared', ...entityTypes, ...featureTypes, `widget-${slice}`] },
    },
  })),
  {
    from: { type: 'screens' },
    allow: {
      to: { type: ['shared', ...entityTypes, ...featureTypes, ...widgetTypes, 'screens'] },
    },
  },
  {
    from: { type: 'app' },
    allow: {
      to: {
        type: ['shared', ...entityTypes, ...featureTypes, ...widgetTypes, 'screens', 'app'],
      },
    },
  },
];

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
      'boundaries/elements': boundaryElements,
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
          rules: boundaryRules,
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
