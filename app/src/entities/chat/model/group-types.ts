export type CreateGroupPayload = {
  title: string;
  participantIds: string[];
  avatarMediaId?: string;
};

export type UpdateGroupPayload = {
  title?: string;
  description?: string | null;
  avatarMediaId?: string | null;
};
