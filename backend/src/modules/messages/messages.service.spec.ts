jest.mock('../push/push.service', () => ({
  PushService: jest.fn().mockImplementation(() => ({
    sendToUsers: jest.fn(),
  })),
}));

import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ChatsService } from '../chats/chats.service';
import { MediaService } from '../media/media.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SocketEvents } from '../realtime/socket-events';
import { PresenceService } from '../realtime/presence.service';
import { PushService } from '../push/push.service';
import { UsersService } from '../users/users.service';
import { ChatParticipant } from '../chats/entities/chat-participant.entity';
import { MessageUserDeletion } from './entities/message-user-deletion.entity';
import { Message } from './entities/message.entity';
import { MessageReceiptService } from './message-receipt.service';
import { MessagesService } from './messages.service';
import { MessageDeliveryStatus, MessageType } from '../../common/enums';

describe('MessagesService', () => {
  let service: MessagesService;
  let messageUserDeletionsRepository: jest.Mocked<
    Pick<Repository<MessageUserDeletion>, 'findOne' | 'create' | 'save'>
  >;
  let messagesRepository: jest.Mocked<
    Pick<
      Repository<Message>,
      'createQueryBuilder' | 'findOne' | 'save' | 'create'
    >
  >;
  let participantsRepository: jest.Mocked<
    Pick<Repository<ChatParticipant>, 'save' | 'update'>
  >;
  let chatsService: jest.Mocked<
    Pick<
      ChatsService,
      | 'getActiveParticipation'
      | 'getUnreadCount'
      | 'touchChat'
      | 'getActiveParticipantUserIds'
      | 'canDeleteMessage'
    >
  >;
  let messageReceiptService: jest.Mocked<
    Pick<
      MessageReceiptService,
      'markReadUpTo' | 'getAggregateStatus' | 'markDeliveredForOnlineRecipients'
    >
  >;
  let realtimeService: jest.Mocked<
    Pick<RealtimeService, 'emitToUser' | 'emitToChat'>
  >;

  beforeEach(async () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    messageUserDeletionsRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((value: Partial<MessageUserDeletion>) => value),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };

    messagesRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((value: Message) => value),
    };

    participantsRepository = {
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
      update: jest.fn().mockResolvedValue(undefined),
    };

    chatsService = {
      getActiveParticipation: jest.fn().mockResolvedValue({
        lastReadMessageId: null,
      }),
      getUnreadCount: jest.fn().mockResolvedValue(0),
      touchChat: jest.fn(),
      getActiveParticipantUserIds: jest.fn().mockResolvedValue([]),
      canDeleteMessage: jest.fn().mockResolvedValue(true),
    };

    messageReceiptService = {
      markReadUpTo: jest.fn().mockResolvedValue([]),
      getAggregateStatus: jest.fn(),
      markDeliveredForOnlineRecipients: jest.fn(),
    };

    realtimeService = {
      emitToUser: jest.fn(),
      emitToChat: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(Message), useValue: messagesRepository },
        {
          provide: getRepositoryToken(MessageUserDeletion),
          useValue: messageUserDeletionsRepository,
        },
        {
          provide: getRepositoryToken(ChatParticipant),
          useValue: participantsRepository,
        },
        { provide: ChatsService, useValue: chatsService },
        { provide: MediaService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: MessageReceiptService, useValue: messageReceiptService },
        { provide: RealtimeService, useValue: realtimeService },
        {
          provide: PresenceService,
          useValue: { getOnlineUserIds: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: PushService,
          useValue: { sendNewMessageNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(MessagesService);
  });

  it('lists messages for an active participant', async () => {
    const result = await service.listMessages('user-1', 'chat-1', {});

    expect(chatsService.getActiveParticipation).toHaveBeenCalledWith(
      'chat-1',
      'user-1',
    );
    expect(result.items).toEqual([]);
  });

  it('throws when cursor message is missing', async () => {
    messagesRepository.findOne.mockResolvedValue(null);

    await expect(
      service.listMessages('user-1', 'chat-1', { cursor: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks chat as read and emits unread update', async () => {
    const message = {
      id: 'msg-1',
      chatId: 'chat-1',
      createdAt: new Date(),
    } as Message;

    messagesRepository.findOne.mockResolvedValue(message);
    chatsService.getUnreadCount.mockResolvedValue(0);

    const result = await service.markChatAsRead('user-1', 'chat-1', {});

    expect(result.unreadCount).toBe(0);
    expect(messageReceiptService.markReadUpTo).toHaveBeenCalled();
    expect(realtimeService.emitToUser).toHaveBeenCalled();
  });

  it('creates a text message and emits realtime event', async () => {
    const savedMessage = {
      id: 'msg-new',
      chatId: 'chat-1',
      senderId: 'user-1',
      type: MessageType.TEXT,
      text: 'hello',
      createdAt: new Date(),
      sender: { id: 'user-1', name: 'Alice' },
    } as Message;

    messagesRepository.save.mockResolvedValue(savedMessage);
    messagesRepository.findOne.mockResolvedValue(savedMessage);
    messageReceiptService.getAggregateStatus.mockResolvedValue(
      MessageDeliveryStatus.SENT,
    );
    jest.spyOn(service as never, 'toResponse' as never).mockResolvedValue({
      id: 'msg-new',
      text: 'hello',
      type: MessageType.TEXT,
      sender: { id: 'user-1', name: 'Alice' },
    } as never);

    const result = await service.createMessage('user-1', 'chat-1', {
      type: MessageType.TEXT,
      text: 'hello',
    });

    expect(result.id).toBe('msg-new');
    expect(chatsService.touchChat).toHaveBeenCalledWith('chat-1');
    expect(realtimeService.emitToChat).toHaveBeenCalled();
  });

  it('deletes message for everyone and returns tombstone', async () => {
    const message = {
      id: 'msg-1',
      chatId: 'chat-1',
      senderId: 'user-1',
      type: MessageType.TEXT,
      text: 'secret',
      mediaId: null,
      replyToId: null,
      deletedAt: null,
      createdAt: new Date(),
      sender: { id: 'user-1', name: 'Alice' },
      media: null,
    } as Message;

    messagesRepository.findOne.mockResolvedValue(message);
    messagesRepository.save.mockResolvedValue(message);

    const tombstone = {
      id: 'msg-1',
      chatId: 'chat-1',
      type: MessageType.TEXT,
      text: null,
      media: null,
      isDeleted: true,
      deletedForEveryone: true,
    };

    jest
      .spyOn(service as never, 'toResponse' as never)
      .mockResolvedValue(tombstone as never);

    const result = await service.deleteMessage('user-1', 'chat-1', 'msg-1');

    expect(result.isDeleted).toBe(true);
    expect(result.text).toBeNull();
    const savedMessage = messagesRepository.save.mock.calls[0][0] as Message;
    expect(savedMessage.deletedAt).toBeInstanceOf(Date);
    expect(savedMessage.text).toBeNull();
    expect(savedMessage.mediaId).toBeNull();
    expect(savedMessage.replyToId).toBeNull();
    expect(realtimeService.emitToChat).toHaveBeenCalledWith(
      'chat-1',
      SocketEvents.MESSAGE_DELETED,
      tombstone,
    );
  });

  it('hides message for current user', async () => {
    const message = {
      id: 'msg-1',
      chatId: 'chat-1',
    } as Message;

    messagesRepository.findOne.mockResolvedValue(message);

    const result = await service.hideMessageForMe('user-1', 'chat-1', 'msg-1');

    expect(result.success).toBe(true);
    expect(messageUserDeletionsRepository.save).toHaveBeenCalled();
    expect(realtimeService.emitToUser).toHaveBeenCalledWith(
      'user-1',
      SocketEvents.MESSAGE_HIDDEN,
      { chatId: 'chat-1', messageId: 'msg-1' },
    );
  });

  it('is idempotent when message is already hidden for user', async () => {
    const message = {
      id: 'msg-1',
      chatId: 'chat-1',
    } as Message;

    messagesRepository.findOne.mockResolvedValue(message);
    messageUserDeletionsRepository.findOne.mockResolvedValue({
      id: 'hide-1',
      messageId: 'msg-1',
      userId: 'user-1',
    } as MessageUserDeletion);

    const result = await service.hideMessageForMe('user-1', 'chat-1', 'msg-1');

    expect(result.success).toBe(true);
    expect(messageUserDeletionsRepository.save).not.toHaveBeenCalled();
    expect(realtimeService.emitToUser).toHaveBeenCalledWith(
      'user-1',
      SocketEvents.MESSAGE_HIDDEN,
      { chatId: 'chat-1', messageId: 'msg-1' },
    );
  });

  it('rejects delete when user lacks permission', async () => {
    const message = {
      id: 'msg-1',
      chatId: 'chat-1',
      senderId: 'user-2',
      deletedAt: null,
      createdAt: new Date(),
    } as Message;

    messagesRepository.findOne.mockResolvedValue(message);
    chatsService.canDeleteMessage.mockResolvedValue(false);

    await expect(
      service.deleteMessage('user-1', 'chat-1', 'msg-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
