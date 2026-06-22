import type { ChatListItem, ChatParticipant } from '../model/types';

export function getCurrentParticipant(
  chat: ChatListItem,
  userId: string | undefined,
): ChatParticipant | undefined {
  if (!userId) {
    return undefined;
  }

  return chat.participants.find((participant) => participant.userId === userId);
}

export function canManageGroup(
  chat: ChatListItem,
  userId: string | undefined,
): boolean {
  if (chat.type !== 'group') {
    return false;
  }

  const participant = getCurrentParticipant(chat, userId);
  return Boolean(participant?.isOwner || participant?.role === 'admin');
}

export function canChangeRoles(
  chat: ChatListItem,
  userId: string | undefined,
): boolean {
  if (chat.type !== 'group') {
    return false;
  }

  return Boolean(getCurrentParticipant(chat, userId)?.isOwner);
}

export function getParticipantRoleLabel(
  participant: ChatParticipant,
  labels: { owner: string; admin: string; member: string },
): string | null {
  if (participant.isOwner) {
    return labels.owner;
  }

  if (participant.role === 'admin') {
    return labels.admin;
  }

  return null;
}
