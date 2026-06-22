import { queryClient } from '@/shared/lib/query-client';
import {
  patchChatListOnNewMessage,
  patchChatPresence,
  patchChatUnreadCount,
  patchMessageStatus,
} from '@/entities/chat';
import { getChatSocket } from '@/shared/lib/socket/chat-socket';
import { useAuthStore } from '@/entities/session';
import type { ChatUpdatedEvent, PresenceUpdateEvent } from '@/entities/chat';
import type { Message } from '@/entities/message';
import type { MessageStatusEvent } from '@/entities/message';
import { useEffect } from 'react';

export function useStreamChatsList(): void {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUserId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    const socket = getChatSocket(accessToken);

    const invalidateChats = () => {
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    };

    const invalidateChatDetail = (payload: { chatId?: string }) => {
      invalidateChats();

      if (payload.chatId) {
        void queryClient.invalidateQueries({ queryKey: ['chat', payload.chatId] });
      }
    };

    const onMessageNew = (message: Message) => {
      patchChatListOnNewMessage(queryClient, message, currentUserId);
    };

    const onChatUpdated = (payload: ChatUpdatedEvent) => {
      if (payload.chatId && payload.unreadCount !== undefined) {
        patchChatUnreadCount(queryClient, payload.chatId, payload.unreadCount);
        return;
      }

      invalidateChatDetail(payload);
    };

    const onMessageStatus = (payload: MessageStatusEvent) => {
      patchMessageStatus(queryClient, payload);
    };

    const onPresenceUpdate = (payload: PresenceUpdateEvent) => {
      patchChatPresence(queryClient, payload.userId, payload.isOnline);
    };

    socket.on('message:new', onMessageNew);
    socket.on('message:status', onMessageStatus);
    socket.on('message:updated', invalidateChats);
    socket.on('message:deleted', invalidateChats);
    socket.on('chat:updated', onChatUpdated);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('chat:participant_added', invalidateChatDetail);
    socket.on('chat:participant_removed', invalidateChatDetail);
    socket.on('chat:participant_left', invalidateChatDetail);
    socket.on('group:owner_changed', invalidateChatDetail);

    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('message:status', onMessageStatus);
      socket.off('message:updated', invalidateChats);
      socket.off('message:deleted', invalidateChats);
      socket.off('chat:updated', onChatUpdated);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('chat:participant_added', invalidateChatDetail);
      socket.off('chat:participant_removed', invalidateChatDetail);
      socket.off('chat:participant_left', invalidateChatDetail);
      socket.off('group:owner_changed', invalidateChatDetail);
    };
  }, [accessToken, currentUserId, isAuthenticated]);
}
