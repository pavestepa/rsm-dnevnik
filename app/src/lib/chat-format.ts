import i18n from '@/i18n';
import type { ChatLastMessage } from '@/types/chat';

export function formatChatTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return i18n.t('chats.yesterday');
  }

  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  if (date >= weekAgo) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  return date.toLocaleDateString([], {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function formatLastMessagePreview(
  message: ChatLastMessage | null,
  currentUserId: string | undefined,
  senderName?: string,
): string {
  if (!message) {
    return '';
  }

  const prefix =
    message.senderId === currentUserId
      ? `${i18n.t('chats.you')}: `
      : senderName
        ? `${senderName}: `
        : '';

  switch (message.type) {
    case 'image':
      return `${prefix}📷 Photo`;
    case 'video':
      return `${prefix}🎥 Video`;
    case 'audio':
      return `${prefix}🎤 Voice message`;
    default:
      return `${prefix}${message.text ?? ''}`;
  }
}
