module.exports = {
  'app/src/**/!(*.test).{ts,tsx}': (filenames) =>
    `pnpm --filter app exec eslint --max-warnings 0 --no-warn-ignored ${filenames.join(' ')}`,
  'app/src/**/*.{ts,tsx}': () =>
    'pnpm --filter app exec tsc --noEmit -p tsconfig.json',
  'backend/{src,test}/**/*.ts': (filenames) =>
    `pnpm --filter backend exec eslint ${filenames.join(' ')}`,
  'backend/src/**/*.ts': (filenames) =>
    `pnpm --filter backend exec jest --findRelatedTests --passWithNoTests ${filenames.join(' ')}`,
  'app/src/**/*.test.ts': (filenames) =>
    `pnpm --filter app exec jest --findRelatedTests --passWithNoTests ${filenames.join(' ')}`,
};
