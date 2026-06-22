import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ChatParticipantRole, ChatType } from '../../common/enums';
import { MediaService } from '../media/media.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PresenceService } from '../realtime/presence.service';
import { Message } from '../messages/entities/message.entity';
import { UsersService } from '../users/users.service';
import { ChatsService } from './chats.service';
import { ChatsUnreadService } from './chats-unread.service';
import { Chat } from './entities/chat.entity';
import { ChatParticipant } from './entities/chat-participant.entity';

describe('ChatsService', () => {
  let service: ChatsService;
  let chatsRepository: jest.Mocked<
    Pick<Repository<Chat>, 'findOne' | 'save' | 'create' | 'update'>
  >;
  let participantsRepository: jest.Mocked<
    Pick<Repository<ChatParticipant>, 'find' | 'findOne' | 'save' | 'create'>
  >;
  let chatsUnreadService: jest.Mocked<
    Pick<ChatsUnreadService, 'getUnreadCount'>
  >;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;

  const baseChat = {
    id: 'chat-1',
    type: ChatType.DIRECT,
    title: null,
    avatarMediaId: null,
    createdById: 'user-1',
    ownerId: null,
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    participants: [
      {
        id: 'part-1',
        chatId: 'chat-1',
        userId: 'user-1',
        role: ChatParticipantRole.MEMBER,
        pinnedAt: null,
        lastReadMessageId: null,
        leftAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          login: 'alice',
          name: 'Alice',
          phone: '+79001111111',
        },
      },
    ],
  } as Chat;

  beforeEach(async () => {
    chatsRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((value: Partial<Chat>) => value as Chat),
      update: jest.fn(),
    };

    participantsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((value: ChatParticipant) => Promise.resolve(value)),
      create: jest
        .fn()
        .mockImplementation(
          (value: Partial<ChatParticipant>) => value as ChatParticipant,
        ),
    };

    chatsUnreadService = {
      getUnreadCount: jest.fn().mockResolvedValue(2),
    };

    usersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        { provide: getRepositoryToken(Chat), useValue: chatsRepository },
        {
          provide: getRepositoryToken(ChatParticipant),
          useValue: participantsRepository,
        },
        { provide: getRepositoryToken(Message), useValue: {} },
        { provide: UsersService, useValue: usersService },
        { provide: MediaService, useValue: {} },
        {
          provide: RealtimeService,
          useValue: { emitToChat: jest.fn(), emitToUser: jest.fn() },
        },
        { provide: PresenceService, useValue: { isOnline: jest.fn() } },
        { provide: ChatsUnreadService, useValue: chatsUnreadService },
      ],
    }).compile();

    service = module.get(ChatsService);
  });

  it('rejects direct chat with yourself', async () => {
    await expect(
      service.createDirectChat('user-1', { participantId: 'user-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('pins a chat for the current user', async () => {
    const participation = { ...baseChat.participants[0], pinnedAt: null };
    jest
      .spyOn(service, 'getActiveParticipation')
      .mockResolvedValue(participation);
    chatsRepository.findOne.mockResolvedValue(baseChat);
    jest
      .spyOn(service as never, 'toChatListItem' as never)
      .mockResolvedValue({ id: 'chat-1', isPinned: true } as never);

    await service.pinChat('user-1', 'chat-1');

    const savedParticipation = participantsRepository.save.mock
      .calls[0][0] as ChatParticipant;
    expect(savedParticipation.pinnedAt).toBeInstanceOf(Date);
  });

  it('unpins a chat for the current user', async () => {
    const participation = {
      ...baseChat.participants[0],
      pinnedAt: new Date(),
    };
    jest
      .spyOn(service, 'getActiveParticipation')
      .mockResolvedValue(participation);
    chatsRepository.findOne.mockResolvedValue(baseChat);
    jest
      .spyOn(service as never, 'toChatListItem' as never)
      .mockResolvedValue({ id: 'chat-1', isPinned: false } as never);

    await service.unpinChat('user-1', 'chat-1');

    expect(participantsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ pinnedAt: null }),
    );
  });

  it('delegates unread count to ChatsUnreadService', async () => {
    chatsUnreadService.getUnreadCount.mockResolvedValue(5);

    const count = await service.getUnreadCount('chat-1', 'user-1', 'msg-1');

    expect(count).toBe(5);
    expect(chatsUnreadService.getUnreadCount).toHaveBeenCalledWith(
      'chat-1',
      'user-1',
      'msg-1',
    );
  });

  it('sorts pinned chats before recent chats in listChats', async () => {
    const pinnedParticipation = {
      ...baseChat.participants[0],
      pinnedAt: new Date(),
      chat: {
        ...baseChat,
        updatedAt: new Date('2026-01-01T10:00:00.000Z'),
      },
    };
    const recentParticipation = {
      ...baseChat.participants[0],
      chatId: 'chat-2',
      chat: {
        ...baseChat,
        id: 'chat-2',
        updatedAt: new Date('2026-01-03T10:00:00.000Z'),
      },
    };

    participantsRepository.find.mockResolvedValue([
      recentParticipation,
      pinnedParticipation,
    ] as ChatParticipant[]);

    const toChatListItemSpy = jest.spyOn(
      service as unknown as {
        toChatListItem: (
          chat: Chat,
          userId: string,
          participation: ChatParticipant,
        ) => Promise<{
          id: string;
          isPinned: boolean;
          lastMessage: null;
          updatedAt: Date;
        }>;
      },
      'toChatListItem',
    );
    toChatListItemSpy.mockImplementation((_chat, _userId, participation) =>
      Promise.resolve({
        id: participation.chat.id,
        isPinned: participation.pinnedAt !== null,
        lastMessage: null,
        updatedAt: participation.chat.updatedAt,
      }),
    );

    const items = await service.listChats('user-1');

    expect(items[0].isPinned).toBe(true);
    expect(items[1].isPinned).toBe(false);
  });

  it('rejects adding participant when actor is not admin', async () => {
    const groupChat: Chat = {
      ...baseChat,
      type: ChatType.GROUP,
      ownerId: 'user-3',
    };
    const participation = {
      ...baseChat.participants[0],
      role: ChatParticipantRole.MEMBER,
    };

    jest
      .spyOn(service, 'getActiveParticipation')
      .mockResolvedValue(participation);
    chatsRepository.findOne.mockResolvedValue(groupChat);

    await expect(
      service.addParticipant('user-1', 'chat-1', 'user-4'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('adds participant when actor is owner', async () => {
    const groupChat: Chat = {
      ...baseChat,
      type: ChatType.GROUP,
      ownerId: 'user-1',
    };
    const participation = {
      ...baseChat.participants[0],
      role: ChatParticipantRole.ADMIN,
    };

    jest
      .spyOn(service, 'getActiveParticipation')
      .mockResolvedValue(participation);
    chatsRepository.findOne.mockResolvedValue(groupChat);
    usersService.findById.mockResolvedValue({ id: 'user-4' } as never);
    participantsRepository.findOne.mockResolvedValue(null);
    jest
      .spyOn(service, 'getChatById')
      .mockResolvedValue({ id: 'chat-1' } as never);

    await service.addParticipant('user-1', 'chat-1', 'user-4');

    expect(participantsRepository.save).toHaveBeenCalled();
  });

  it('throws when participant user not found on add', async () => {
    const groupChat: Chat = {
      ...baseChat,
      type: ChatType.GROUP,
      ownerId: 'user-1',
    };
    const participation = {
      ...baseChat.participants[0],
      role: ChatParticipantRole.ADMIN,
    };

    jest
      .spyOn(service, 'getActiveParticipation')
      .mockResolvedValue(participation);
    chatsRepository.findOne.mockResolvedValue(groupChat);
    usersService.findById.mockResolvedValue(null);

    await expect(
      service.addParticipant('user-1', 'chat-1', 'missing-user'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
