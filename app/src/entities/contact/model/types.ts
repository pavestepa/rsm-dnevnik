export type ContactSource = 'manual' | 'device';

export type Contact = {
  id: string;
  phone: string;
  displayName: string;
  matchedUserId: string | null;
  matchedUserName: string | null;
  matchedUserAvatarUrl: string | null;
  isRegistered: boolean;
  source: ContactSource;
  createdAt: string;
  updatedAt: string;
};

export type CreateContactPayload = {
  phone: string;
  displayName?: string;
};

export type SyncContactItem = {
  phone: string;
  displayName?: string;
};

export type SyncContactsPayload = {
  contacts: SyncContactItem[];
};
