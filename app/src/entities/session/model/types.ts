export type User = {
  id: string;
  name: string;
  phone: string | null;
  bio: string | null;
  avatarMediaId: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

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

export type UpdateProfilePayload = {
  name?: string;
  bio?: string;
  avatarMediaId?: string | null;
};

export type PresignUploadPayload = {
  kind: 'avatar';
  mimeType: string;
  size: number;
  fileName?: string;
};

export type PresignUploadResponse = {
  mediaId: string;
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
};

export type MediaResponse = {
  id: string;
  kind: string;
  mimeType: string;
  size: number;
  status: string;
  downloadUrl: string | null;
  durationSeconds: number | null;
  createdAt: string;
};
