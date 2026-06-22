/**
 * Pilot generated types for contacts module.
 * Regenerate: pnpm --filter backend openapi:export && pnpm --filter app openapi:types
 */
export type ContactSource = 'manual' | 'device';

export type ContactResponse = {
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

export type CreateContactRequest = {
  phone: string;
  displayName?: string;
};
