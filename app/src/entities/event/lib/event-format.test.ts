import {
  formatEventDate,
  groupEventsByDate,
  truncateEventBody,
  truncateChatPreview,
} from './event-format';
import type { EventListItem } from '../model/types';

describe('event-format', () => {
  it('truncates long body with hasMore flag', () => {
    const body = 'a'.repeat(120);
    expect(truncateEventBody(body)).toEqual({
      text: 'a'.repeat(100),
      hasMore: true,
    });
  });

  it('keeps short body unchanged', () => {
    expect(truncateEventBody('Hello')).toEqual({
      text: 'Hello',
      hasMore: false,
    });
  });

  it('truncates chat preview with ellipsis', () => {
    expect(truncateChatPreview('x'.repeat(60), 48)).toBe(`${'x'.repeat(48)}...`);
  });

  it('groups events by formatted date', () => {
    const events: EventListItem[] = [
      {
        id: '1',
        title: 'A',
        bodyPreview: '',
        createdAt: '2026-06-20T10:00:00.000Z',
        updatedAt: '2026-06-20T10:00:00.000Z',
        author: { id: 'u1', name: 'Alice', avatarUrl: null },
        group: { id: 'g1', title: 'Group', avatarUrl: null },
        images: [],
        totalImages: 0,
        filesCount: 0,
        chatId: 'c1',
        chatPreview: { lastMessage: null, writerAvatars: [] },
        canEdit: true,
        canDelete: true,
      },
    ];

    const sections = groupEventsByDate(events);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe(formatEventDate(events[0].createdAt));
    expect(sections[0].data).toHaveLength(1);
  });
});
