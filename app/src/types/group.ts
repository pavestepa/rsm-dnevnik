import type { User } from '@/types/auth';

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
