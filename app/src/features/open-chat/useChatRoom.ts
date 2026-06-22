import {
  getChatSocket,
  joinChatRoom,
  leaveChatRoom,
} from '@/shared/lib/socket/chat-socket';
import { useAuthStore } from '@/entities/session';
import { useEffect } from 'react';

export function useChatRoom(chatId: string | undefined) {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!chatId || !accessToken) {
      return;
    }

    const socket = getChatSocket(accessToken);

    const onConnect = () => {
      void joinChatRoom(chatId);
    };

    if (socket.connected) {
      void joinChatRoom(chatId);
    }

    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
      void leaveChatRoom(chatId);
    };
  }, [accessToken, chatId]);
}
