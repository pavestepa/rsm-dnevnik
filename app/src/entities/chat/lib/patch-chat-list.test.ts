import { QueryClient } from '@tanstack/react-query';
import type { Message } from '@/entities/message';
import { patchChatListOnNewMessage, patchChatPresence } from './patch-chat-list';
import { makeChatListItem } from './__fixtures__/chat-list-item';

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    chatId: 'chat-1',
    type: 'text',
    text: 'Hello',
    media: null,
    sender: { id: 'user-b', name: 'Bob', avatarUrl: null },
    replyToId: null,
    createdAt: '2026-06-19T12:00:00.000Z',
    editedAt: null,
    status: 'sent',
    ...overrides,
  };
}

describe('patchChatListOnNewMessage', () => {
  it('updates lastMessage and increments unread for incoming messages', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['chats', ''], [makeChatListItem({ unreadCount: 2 })]);

    patchChatListOnNewMessage(
      queryClient,
      makeMessage({ text: 'New text' }),
      'user-a',
    );

    const chats = queryClient.getQueryData<ReturnType<typeof makeChatListItem>[]>([
      'chats',
      '',
    ]);

    expect(chats?.[0].lastMessage?.text).toBe('New text');
    expect(chats?.[0].unreadCount).toBe(3);
  });

  it('does not increment unread for own messages', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['chats', ''], [makeChatListItem({ unreadCount: 1 })]);

    patchChatListOnNewMessage(
      queryClient,
      makeMessage({ sender: { id: 'user-a', name: 'Me', avatarUrl: null } }),
      'user-a',
    );

    const chats = queryClient.getQueryData<ReturnType<typeof makeChatListItem>[]>([
      'chats',
      '',
    ]);

    expect(chats?.[0].unreadCount).toBe(1);
  });

  it('moves unpinned chat to top of unpinned section', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      ['chats', ''],
      [
        makeChatListItem({ id: 'chat-a', displayName: 'A' }),
        makeChatListItem({ id: 'chat-b', displayName: 'B' }),
      ],
    );

    patchChatListOnNewMessage(
      queryClient,
      makeMessage({ chatId: 'chat-b' }),
      'user-a',
    );

    const chats = queryClient.getQueryData<ReturnType<typeof makeChatListItem>[]>([
      'chats',
      '',
    ]);

    expect(chats?.map((chat) => chat.id)).toEqual(['chat-b', 'chat-a']);
  });
});

describe('patchChatPresence', () => {
  it('updates online status for direct chats with matching peer', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      ['chats', ''],
      [
        makeChatListItem({ peerUserId: 'peer-1', isOnline: false }),
        makeChatListItem({ id: 'chat-2', peerUserId: 'peer-2', isOnline: false }),
      ],
    );

    patchChatPresence(queryClient, 'peer-1', true);

    const chats = queryClient.getQueryData<ReturnType<typeof makeChatListItem>[]>([
      'chats',
      '',
    ]);

    expect(chats?.[0].isOnline).toBe(true);
    expect(chats?.[1].isOnline).toBe(false);
  });
});
