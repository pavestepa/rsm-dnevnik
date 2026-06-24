import type { User } from '@/shared/model/user';

export type { User, UpdateProfilePayload } from '@/shared/model/user';

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
};

export type LoginPayload = {
  login: string;
  password: string;
};
