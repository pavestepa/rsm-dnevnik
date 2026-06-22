# Testing

## Pyramid

1. **Unit** — services (backend), entity lib + feature hooks (app)
2. **Integration** — React Query hooks with mocked APIs; WebSocket handlers
3. **E2E** — backend supertest suites; optional Maestro smoke on `main`

## App

```bash
pnpm --filter app test
pnpm --filter app test:cov
```

Test harness: `app/src/shared/test/` — `renderHookWithProviders`, fixtures.

## Backend

```bash
pnpm --filter backend test
pnpm --filter backend test:cov
```

### E2E locally

```bash
pnpm db:up
pnpm db:migrate
cp users.json.example users.json   # if needed
pnpm --filter backend seed:users
pnpm test:e2e
```

Test users: Alice `+79001111111`, Bob `+79002222222`, password `password123`.

## Mobile smoke (Maestro)

```bash
maestro test app/.maestro/smoke.yaml
```

Requires dev client build and running backend.
