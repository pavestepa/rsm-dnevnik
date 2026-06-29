import { isEventChatType, isGroupLikeChatType, isVisibleInChatList } from './chat-kind';

describe('chat kind helpers', () => {
  it('identifies event chats', () => {
    expect(isEventChatType('event')).toBe(true);
    expect(isEventChatType('group')).toBe(false);
    expect(isEventChatType('direct')).toBe(false);
  });

  it('hides event chats from the general chat list', () => {
    expect(isVisibleInChatList('direct')).toBe(true);
    expect(isVisibleInChatList('group')).toBe(true);
    expect(isVisibleInChatList('event')).toBe(false);
  });

  it('treats group and event chats as group-like', () => {
    expect(isGroupLikeChatType('group')).toBe(true);
    expect(isGroupLikeChatType('event')).toBe(true);
  });

  it('does not treat direct chats as group-like', () => {
    expect(isGroupLikeChatType('direct')).toBe(false);
  });
});
