import type { ChatType } from '../model/types';

export function isEventChatType(type: ChatType): boolean {
  return type === 'event';
}

export function isGroupLikeChatType(type: ChatType): boolean {
  return type === 'group' || type === 'event';
}

export function isVisibleInChatList(type: ChatType): boolean {
  return !isEventChatType(type);
}
