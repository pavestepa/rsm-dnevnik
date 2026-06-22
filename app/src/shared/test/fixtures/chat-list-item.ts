import type { ChatListItem } from '@/entities/chat';

export function makeChatListItem(
  overrides: Partial<ChatListItem> = {},
): ChatListItem {
  return {
    id: 'chat-1',
    type: 'direct',
    title: null,
    displayName: 'Alice',
    avatarUrl: null,
    unreadCount: 0,
    isPinned: false,
    isOnline: false,
    peerUserId: 'peer-1',
    peerPhone: '+79001111111',
    lastMessage: null,
    participants: [],
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}
