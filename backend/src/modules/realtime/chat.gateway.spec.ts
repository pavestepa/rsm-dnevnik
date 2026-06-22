jest.mock('../messages/messages.service', () => ({
  MessagesService: class {},
}));

import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatsService } from '../chats/chats.service';
import { MessageReceiptService } from '../messages/message-receipt.service';
import { MessagesService } from '../messages/messages.service';
import { ChatGateway } from './chat.gateway';
import { PresenceService } from './presence.service';
import { RealtimeService } from './realtime.service';
import { TypingService } from './typing.service';
import { WsAuthService } from './ws-auth.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let wsAuthService: jest.Mocked<Pick<WsAuthService, 'verifyToken'>>;
  let chatsService: jest.Mocked<Pick<ChatsService, 'getActiveParticipation'>>;

  beforeEach(async () => {
    wsAuthService = {
      verifyToken: jest.fn(),
    };

    chatsService = {
      getActiveParticipation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: WsAuthService, useValue: wsAuthService },
        {
          provide: PresenceService,
          useValue: { add: jest.fn(), remove: jest.fn() },
        },
        { provide: TypingService, useValue: {} },
        { provide: RealtimeService, useValue: { setServer: jest.fn() } },
        { provide: ChatsService, useValue: chatsService },
        { provide: MessageReceiptService, useValue: {} },
        { provide: MessagesService, useValue: {} },
      ],
    }).compile();

    gateway = module.get(ChatGateway);
  });

  it('rejects connection without valid token', async () => {
    wsAuthService.verifyToken.mockRejectedValue(new ForbiddenException());

    const client = {
      handshake: { auth: {}, headers: {} },
      disconnect: jest.fn(),
      data: {},
    };

    await gateway.handleConnection(client as never);

    expect(client.disconnect).toHaveBeenCalled();
  });

  it('joins chat room for active participant', async () => {
    chatsService.getActiveParticipation.mockResolvedValue({} as never);

    const join = jest.fn();
    const client = {
      data: { userId: 'user-1' },
      join,
    };

    const result = await gateway.handleChatJoin(client as never, {
      chatId: 'chat-1',
    });

    expect(chatsService.getActiveParticipation).toHaveBeenCalledWith(
      'chat-1',
      'user-1',
    );
    expect(join).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});
