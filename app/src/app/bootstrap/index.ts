import { useChatSocketConnection } from './useChatSocketConnection';
import { useStreamChatsList } from '@/features/stream-chats-list';

export { useChatSocketConnection } from './useChatSocketConnection';
export { useStreamChatsList } from '@/features/stream-chats-list';
export { useChatRoom } from '@/features/open-chat';

/** @deprecated use useChatSocketConnection + useStreamChatsList */
export function useChatSocket(): void {
  useChatSocketConnection();
  useStreamChatsList();
}
