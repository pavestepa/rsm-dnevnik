# Contributing

## Branch and PR workflow

1. Create a feature branch from `main`
2. Make focused commits
3. Open a PR — CI must pass (lint, unit tests, backend e2e)
4. Fill out the PR template

## Required checks locally

```bash
pnpm install
pnpm check          # lint + unit tests
pnpm test:e2e       # backend e2e (requires docker + migrate + seed)
```

## Tests

| Area | Command | Requirement |
|------|---------|-------------|
| App unit | `pnpm --filter app test` | New features need `*.test.ts` |
| Backend unit | `pnpm --filter backend test` | Services with business logic need specs |
| Backend e2e | `pnpm test:e2e` | New endpoints need e2e coverage |

See [docs/testing.md](docs/testing.md) for the test pyramid.

## Layer rules (app)

- `features/*` → only `@/shared/*`, `@/entities/*`
- No cross-feature imports
- Public API via barrel `index.ts`

## Backend

- `pnpm --filter backend lint` — check only (no auto-fix in CI)
- `pnpm --filter backend format` — prettier write locally

## Migrations

If your PR adds a TypeORM migration, note it in the PR template and document rollout steps.

## Scaffold a feature

```bash
pnpm app create-feature my-feature-name
```
