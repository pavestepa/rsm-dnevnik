#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const featureName = process.argv[2];

if (!featureName) {
  console.error('Usage: pnpm app create-feature <feature-name>');
  process.exit(1);
}

const kebab = featureName.replace(/_/g, '-').toLowerCase();
const hookName = kebab
  .split('-')
  .map((part, index) =>
    index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
  )
  .join('');
const hookFile = `use${hookName.charAt(0).toUpperCase()}${hookName.slice(1)}.ts`;
const classHook = hookFile.replace('.ts', '');

const root = join(process.cwd(), 'src', 'features', kebab);
mkdirSync(root, { recursive: true });

writeFileSync(
  join(root, hookFile),
  `export function ${classHook}() {
  throw new Error('${classHook} is not implemented yet');
}
`,
);

writeFileSync(
  join(root, 'index.ts'),
  `export { ${classHook} } from './${hookFile.replace('.ts', '')}';
`,
);

writeFileSync(
  join(root, `${kebab}.test.ts`),
  `import { ${classHook} } from './${hookFile.replace('.ts', '')}';

describe('${classHook}', () => {
  it('is scaffolded', () => {
    expect(${classHook}).toBeDefined();
  });
});
`,
);

console.log(`Created feature scaffold at src/features/${kebab}/`);
