import type { Message } from '@/entities/message';

export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    chatId: 'chat-1',
    type: 'text',
    text: 'Hello',
    media: null,
    sender: {
      id: 'user-2',
      name: 'Bob',
      avatarUrl: null,
    },
    replyToId: null,
    status: 'sent',
    editedAt: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}
