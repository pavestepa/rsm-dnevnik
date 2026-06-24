import { canManageGroup } from '@/entities/chat';
import { makeChatListItem } from '@/shared/test';
import { makeMessage } from '@/shared/test';
import {
  canDeleteMessageForEveryone,
  DELETE_FOR_EVERYONE_WINDOW_MS,
} from './can-delete-for-everyone';

jest.mock('@/entities/chat', () => ({
  canManageGroup: jest.fn(),
}));

const mockedCanManageGroup = canManageGroup as jest.MockedFunction<typeof canManageGroup>;

describe('canDeleteMessageForEveryone', () => {
  const currentUserId = 'user-1';
  const groupChat = makeChatListItem({ type: 'group' });

  beforeEach(() => {
    mockedCanManageGroup.mockReturnValue(false);
  });

  it('allows deleting own recent message in direct chat', () => {
    const message = makeMessage({
      sender: { id: currentUserId, name: 'Alice', avatarUrl: null },
      createdAt: new Date().toISOString(),
    });

    expect(canDeleteMessageForEveryone(message, currentUserId, undefined)).toBe(true);
  });

  it('rejects deleting already deleted messages', () => {
    const message = makeMessage({
      isDeleted: true,
      sender: { id: currentUserId, name: 'Alice', avatarUrl: null },
    });

    expect(canDeleteMessageForEveryone(message, currentUserId, undefined)).toBe(false);
  });

  it('rejects deleting own message outside 48h window', () => {
    const message = makeMessage({
      sender: { id: currentUserId, name: 'Alice', avatarUrl: null },
      createdAt: new Date(
        Date.now() - DELETE_FOR_EVERYONE_WINDOW_MS - 60_000,
      ).toISOString(),
    });

    expect(canDeleteMessageForEveryone(message, currentUserId, undefined)).toBe(false);
  });

  it('allows group admin to delete another member message', () => {
    mockedCanManageGroup.mockReturnValue(true);
    const message = makeMessage({
      sender: { id: 'user-2', name: 'Bob', avatarUrl: null },
      createdAt: new Date(
        Date.now() - DELETE_FOR_EVERYONE_WINDOW_MS - 60_000,
      ).toISOString(),
    });

    expect(canDeleteMessageForEveryone(message, currentUserId, groupChat)).toBe(true);
  });

  it('rejects deleting someone else message in direct chat', () => {
    const message = makeMessage({
      sender: { id: 'user-2', name: 'Bob', avatarUrl: null },
    });

    expect(canDeleteMessageForEveryone(message, currentUserId, undefined)).toBe(false);
  });

  it('rejects when current user is unknown', () => {
    const message = makeMessage({
      sender: { id: currentUserId, name: 'Alice', avatarUrl: null },
    });

    expect(canDeleteMessageForEveryone(message, undefined, undefined)).toBe(false);
  });
});
