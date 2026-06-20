import type { Message } from '@/types/message';
import { isSameCalendarDay } from '@/lib/message-format';

export type MessageListRow =
  | { type: 'date'; id: string; date: string }
  | { type: 'message'; id: string; message: Message };

export function buildMessageListRows(messages: Message[]): MessageListRow[] {
  const rows: MessageListRow[] = [];

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    const previous = messages[index - 1];

    if (!previous || !isSameCalendarDay(previous.createdAt, message.createdAt)) {
      rows.push({
        type: 'date',
        id: `date-${message.createdAt.slice(0, 10)}-${message.id}`,
        date: message.createdAt,
      });
    }

    rows.push({ type: 'message', id: message.id, message });
  }

  return rows;
}

/** Rows for inverted FlatList: date pill visually above that day's messages. */
export function buildInvertedMessageListRows(messages: Message[]): MessageListRow[] {
  return buildMessageListRows(messages).reverse();
}
