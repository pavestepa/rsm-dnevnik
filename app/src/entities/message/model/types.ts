export type MessageType = 'text' | 'image' | 'video' | 'audio';

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export type MessageMedia = {
  id: string;
  mimeType: string;
  size: number;
  url: string | null;
  durationSeconds: number | null;
};

export type MessageSender = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type Message = {
  id: string;
  chatId: string;
  type: MessageType;
  text: string | null;
  media: MessageMedia | null;
  sender: MessageSender;
  replyToId: string | null;
  createdAt: string;
  editedAt: string | null;
  status: MessageDeliveryStatus | null;
  isDeleted?: boolean;
  deletedForEveryone?: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CreateMessagePayload = {
  type: MessageType;
  text?: string;
  mediaId?: string;
  caption?: string;
  replyToId?: string;
};

export type MessageStatusEvent = {
  messageId: string;
  chatId: string;
  status: MessageDeliveryStatus;
};

export type MessageDeletedEvent = Message;

export type MessageHiddenEvent = {
  chatId: string;
  messageId: string;
};

export type TypingUpdateEvent = {
  chatId: string;
  userId: string;
  isTyping: boolean;
};
