import { disconnectChatSocket, getChatSocket } from '@/shared/lib/socket/chat-socket';
import { useAuthStore } from '@/entities/session';
import { useEffect } from 'react';

export function useChatSocketConnection(): void {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectChatSocket();
      return;
    }

    getChatSocket(accessToken);
  }, [accessToken, isAuthenticated]);
}
