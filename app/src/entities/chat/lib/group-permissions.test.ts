import {
  canChangeRoles,
  canManageGroup,
  getParticipantRoleLabel,
} from './group-permissions';
import { makeChatListItem } from './__fixtures__/chat-list-item';

const adminParticipant = {
  id: 'p1',
  userId: 'user-1',
  name: 'Admin',
  phone: null,
  avatarUrl: null,
  role: 'admin' as const,
  isOwner: false,
};

const ownerParticipant = {
  ...adminParticipant,
  userId: 'owner-1',
  isOwner: true,
};

describe('group-permissions', () => {
  it('allows group admins to manage group', () => {
    const chat = makeChatListItem({
      type: 'group',
      participants: [adminParticipant],
    });

    expect(canManageGroup(chat, 'user-1')).toBe(true);
    expect(canManageGroup(chat, 'stranger')).toBe(false);
  });

  it('allows only owner to change roles', () => {
    const chat = makeChatListItem({
      type: 'group',
      participants: [ownerParticipant, adminParticipant],
    });

    expect(canChangeRoles(chat, 'owner-1')).toBe(true);
    expect(canChangeRoles(chat, 'user-1')).toBe(false);
  });

  it('returns role labels for owner and admin', () => {
    const labels = { owner: 'Owner', admin: 'Admin', member: 'Member' };

    expect(getParticipantRoleLabel(ownerParticipant, labels)).toBe('Owner');
    expect(getParticipantRoleLabel(adminParticipant, labels)).toBe('Admin');
    expect(
      getParticipantRoleLabel({ ...adminParticipant, role: 'member' }, labels),
    ).toBeNull();
  });
});
