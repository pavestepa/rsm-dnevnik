import { queryClient } from '@/lib/query-client';
import { patchChatUnreadCount, patchMessageStatus } from '@/lib/chat-cache';
import {
  disconnectChatSocket,
  getChatSocket,
  joinChatRoom,
  leaveChatRoom,
} from '@/lib/chat-socket';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatUpdatedEvent, PresenceUpdateEvent } from '@/types/chat';
import type { MessageStatusEvent } from '@/types/message';
import { useEffect } from 'react';

export function useChatSocket(): void {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectChatSocket();
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

    const onPresenceUpdate = (_payload: PresenceUpdateEvent) => {
      invalidateChats();
    };

    socket.on('message:status', onMessageStatus);
    socket.on('message:new', invalidateChats);
    socket.on('message:updated', invalidateChats);
    socket.on('message:deleted', invalidateChats);
    socket.on('chat:updated', onChatUpdated);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('chat:participant_added', invalidateChatDetail);
    socket.on('chat:participant_removed', invalidateChatDetail);
    socket.on('chat:participant_left', invalidateChatDetail);
    socket.on('group:owner_changed', invalidateChatDetail);

    return () => {
      socket.off('message:status', onMessageStatus);
      socket.off('message:new', invalidateChats);
      socket.off('message:updated', invalidateChats);
      socket.off('message:deleted', invalidateChats);
      socket.off('chat:updated', onChatUpdated);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('chat:participant_added', invalidateChatDetail);
      socket.off('chat:participant_removed', invalidateChatDetail);
      socket.off('chat:participant_left', invalidateChatDetail);
      socket.off('group:owner_changed', invalidateChatDetail);
    };
  }, [accessToken, isAuthenticated]);
}

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
