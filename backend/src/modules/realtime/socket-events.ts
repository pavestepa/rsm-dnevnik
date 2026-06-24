export const SocketEvents = {
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_NEW: 'message:new',
  MESSAGE_STATUS: 'message:status',
  CHAT_UPDATED: 'chat:updated',
  CHAT_PARTICIPANT_ADDED: 'chat:participant_added',
  CHAT_PARTICIPANT_REMOVED: 'chat:participant_removed',
  CHAT_PARTICIPANT_LEFT: 'chat:participant_left',
  GROUP_OWNER_CHANGED: 'group:owner_changed',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  TYPING_UPDATE: 'typing:update',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_HIDDEN: 'message:hidden',
  CHAT_DELETED: 'chat:deleted',
  PRESENCE_UPDATE: 'presence:update',
} as const;

export const chatRoom = (chatId: string) => `chat:${chatId}`;
export const userRoom = (userId: string) => `user:${userId}`;
