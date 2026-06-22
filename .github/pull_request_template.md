## Summary

<!-- What changed and why -->

## Tests

- [ ] Unit tests added/updated
- [ ] Backend e2e added/updated (if API changed)

## Architecture

- [ ] FSD layer boundaries respected (no cross-feature imports)
- [ ] Feature has public `index.ts` barrel

## Database

- [ ] Migration needed
- [ ] Migration included in PR

## Checklist

- [ ] `pnpm check` passes locally
- [ ] OpenAPI export updated (if DTOs changed): `pnpm --filter backend openapi:export`
