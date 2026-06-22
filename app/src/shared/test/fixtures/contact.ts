import type { Contact } from '@/entities/contact';

export function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'contact-1',
    phone: '+79003333333',
    displayName: 'Charlie',
    matchedUserId: null,
    matchedUserName: null,
    matchedUserAvatarUrl: null,
    isRegistered: false,
    source: 'manual',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}
