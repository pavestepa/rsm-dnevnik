export type ChatType = 'direct' | 'group';

export type ChatLastMessage = {
  id: string;
  type: string;
  text: string | null;
  senderId: string;
  createdAt: string;
};

export type ChatParticipantRole = 'member' | 'admin';

export type ChatParticipant = {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: ChatParticipantRole;
  isOwner: boolean;
};

export type ChatListItem = {
  id: string;
  type: ChatType;
  title: string | null;
  displayName: string;
  avatarUrl: string | null;
  unreadCount: number;
  isPinned: boolean;
  isOnline: boolean;
  peerUserId: string | null;
  peerPhone: string | null;
  lastMessage: ChatLastMessage | null;
  participants: ChatParticipant[];
  updatedAt: string;
};

export type PresenceUpdateEvent = {
  userId: string;
  isOnline: boolean;
};

export type ChatUpdatedEvent = {
  chatId: string;
  unreadCount?: number;
};
