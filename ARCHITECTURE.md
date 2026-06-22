# Architecture

## Monorepo layout

- `app/` — Expo React Native client (Feature-Sliced Design)
- `backend/` — NestJS API + WebSocket gateway
- `packages/shared-types/` — optional Zod schemas shared across packages

## App layers (FSD)

```
shared → entities → features → widgets → screens → app
```

| Layer | Responsibility |
|-------|----------------|
| `shared` | API client, config, theme, i18n, utilities |
| `entities` | Domain models, API adapters, entity UI primitives |
| `features` | User actions (send message, pin chat, add contact) |
| `widgets` | Composite UI blocks (chat list, search bar) |
| `screens` | Route-level composition |
| `app` | Bootstrap, providers, navigation |

### Rules

- Features import only `shared` and `entities` (enforced by ESLint boundaries)
- Features must not import other features
- Each feature exposes a public API via `index.ts`

## Data flow

- **REST** — TanStack Query hooks in features call entity APIs
- **WebSocket** — `useStreamChatsList` patches React Query cache on realtime events
- **Auth** — Zustand store in `entities/session`, tokens in SecureStore

## Adding a feature

```bash
pnpm app create-feature delete-message-for-me
```

Checklist:

1. Create slice under `app/src/features/<name>/`
2. Add hook + tests (`*.test.ts`)
3. Export from `index.ts`
4. Wire in screen/widget — never re-export from another feature

## Backend modules

NestJS modules under `backend/src/modules/*` map to domain areas: `auth`, `chats`, `messages`, `contacts`, `realtime`, `media`, `push`.

Unread logic lives in `ChatsUnreadService` for isolated testing.

## API contracts

OpenAPI spec is exported via `pnpm --filter backend openapi:export`. App can generate types into `app/src/shared/api/generated/`.
