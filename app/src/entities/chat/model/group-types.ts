import type { User } from '@/entities/session';

export type UserSearchResult = Pick<User, 'id' | 'name' | 'phone' | 'avatarUrl'>;

export type CreateGroupPayload = {
  title: string;
  participantIds: string[];
  avatarMediaId?: string;
};

export type UpdateGroupPayload = {
  title?: string;
  avatarMediaId?: string | null;
};
