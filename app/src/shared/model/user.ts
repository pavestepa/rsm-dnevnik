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

export type UpdateProfilePayload = {
  name?: string;
  bio?: string;
  avatarMediaId?: string | null;
};
