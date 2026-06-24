import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

jest.mock('react-native', () => {
  const React = require('react') as typeof import('react');

  return {
    Image: 'img',
    Pressable: ({
      children,
      ...props
    }: {
      children?: ReactNode;
    }) => React.createElement('button', props, children),
    StyleSheet: {
      create: (styles: Record<string, unknown>) => styles,
      absoluteFill: {},
      hairlineWidth: 1,
    },
    Text: ({ children }: { children?: ReactNode }) =>
      React.createElement('span', null, children),
    View: ({ children }: { children?: ReactNode }) =>
      React.createElement('div', null, children),
  };
});

jest.mock('@/entities/message', () => ({
  MessageStatusIcon: () => null,
  formatMessageTime: () => '10:00',
}));

jest.mock('@/shared/lib/media-url', () => ({
  resolveMediaUrl: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'chats.deletedMessage': 'Message deleted',
        'chats.deletedByYou': 'You deleted this message',
        'chats.edited': 'edited',
      })[key] ?? key,
  }),
}));

jest.mock('@/shared/lib/hooks/useAppTheme', () => ({
  useAppTheme: () => ({
    colors: {
      chatBubbleOutgoing: '#dcf8c6',
      chatBubbleIncoming: '#ffffff',
      chatBubbleOutgoingText: '#111111',
      chatBubbleIncomingText: '#111111',
      chatBubbleMetaOwn: '#667781',
      chatBubbleMeta: '#667781',
      primary: '#008069',
    },
  }),
}));

import { MessageBubble } from '@/entities/message/ui/MessageBubble';
import { makeMessage } from '@/shared/test';

describe('MessageBubble', () => {
  it('renders tombstone text for deleted messages', () => {
    render(
      createElement(MessageBubble, {
        message: makeMessage({
          isDeleted: true,
          deletedForEveryone: true,
          text: null,
        }),
        isOwn: false,
      }),
    );

    expect(screen.getByText('Message deleted')).toBeTruthy();
  });

  it('renders own deleted label for outgoing tombstones', () => {
    render(
      createElement(MessageBubble, {
        message: makeMessage({
          isDeleted: true,
          deletedForEveryone: true,
          text: null,
          sender: { id: 'user-1', name: 'Alice', avatarUrl: null },
        }),
        isOwn: true,
      }),
    );

    expect(screen.getByText('You deleted this message')).toBeTruthy();
  });

  it('renders message text for active messages', () => {
    render(
      createElement(MessageBubble, {
        message: makeMessage({ text: 'Hello there' }),
        isOwn: false,
      }),
    );

    expect(screen.getByText('Hello there')).toBeTruthy();
  });
});
