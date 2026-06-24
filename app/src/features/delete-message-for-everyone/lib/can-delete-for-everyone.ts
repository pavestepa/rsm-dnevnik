import { canManageGroup } from '@/entities/chat';
import type { ChatListItem } from '@/entities/chat';
import type { Message } from '@/entities/message';

export const DELETE_FOR_EVERYONE_WINDOW_MS = 48 * 60 * 60 * 1000;

export function canDeleteMessageForEveryone(
  message: Message,
  currentUserId: string | undefined,
  chat: ChatListItem | undefined,
): boolean {
  if (!currentUserId || message.isDeleted) {
    return false;
  }

  const isOwn = message.sender.id === currentUserId;
  const canManage = chat ? canManageGroup(chat, currentUserId) : false;

  if (!isOwn && !canManage) {
    return false;
  }

  if (
    isOwn &&
    Date.now() - new Date(message.createdAt).getTime() > DELETE_FOR_EVERYONE_WINDOW_MS
  ) {
    return false;
  }

  return true;
}
