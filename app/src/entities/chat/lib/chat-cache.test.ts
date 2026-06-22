import { QueryClient } from '@tanstack/react-query';
import { patchChatUnreadCount } from './chat-cache';
import { makeChatListItem } from './__fixtures__/chat-list-item';

describe('patchChatUnreadCount', () => {
  it('updates unread count in chat list and chat detail cache', () => {
    const queryClient = new QueryClient();
    const chat = makeChatListItem({ id: 'chat-1', unreadCount: 5 });

    queryClient.setQueryData(['chats'], [chat]);
    queryClient.setQueryData(['chat', 'chat-1'], chat);

    patchChatUnreadCount(queryClient, 'chat-1', 0);

    const list = queryClient.getQueryData<typeof chat[]>(['chats']);
    const detail = queryClient.getQueryData<typeof chat>(['chat', 'chat-1']);

    expect(list?.[0].unreadCount).toBe(0);
    expect(detail?.unreadCount).toBe(0);
  });
});
