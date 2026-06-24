import type { User } from '@/shared/model/user';

export type UserSearchResult = Pick<User, 'id' | 'name' | 'phone' | 'avatarUrl'>;
