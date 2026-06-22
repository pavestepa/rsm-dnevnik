import type { User } from '@/entities/session';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Alice',
    phone: '+79001111111',
    bio: null,
    avatarMediaId: null,
    avatarUrl: null,
    isActive: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}
