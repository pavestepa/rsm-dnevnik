import { QueryClient } from '@tanstack/react-query';
import { patchChatPresence } from './patch-chat-list';
import { makeChatListItem } from '@/shared/test';

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
