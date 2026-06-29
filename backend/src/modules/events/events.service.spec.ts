import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { EventMedia } from './entities/event-media.entity';
import { Chat } from '../chats/entities/chat.entity';
import { ChatParticipant } from '../chats/entities/chat-participant.entity';
import { Message } from '../messages/entities/message.entity';
import { ChatsService } from '../chats/chats.service';
import { MediaService } from '../media/media.service';
import { UsersService } from '../users/users.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ChatParticipantRole } from '../../common/enums';

describe('EventsService', () => {
  let service: EventsService;
  let eventsRepository: jest.Mocked<
    Pick<
      Repository<Event>,
      'findOne' | 'create' | 'save' | 'createQueryBuilder'
    >
  >;
  let chatsService: jest.Mocked<
    Pick<
      ChatsService,
      | 'getActiveParticipation'
      | 'getActiveParticipantUserIds'
      | 'createEventChat'
    >
  >;
  let mediaService: jest.Mocked<
    Pick<
      MediaService,
      | 'assertOwnedUploadedMedia'
      | 'getPublicUrlForMediaId'
      | 'getDownloadUrlForUser'
    >
  >;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;
  let eventMediaRepository: jest.Mocked<
    Pick<Repository<EventMedia>, 'find' | 'delete' | 'create' | 'save'>
  >;
  let chatsRepository: jest.Mocked<
    Pick<Repository<Chat>, 'findOne' | 'save' | 'update'>
  >;
  let participantsRepository: jest.Mocked<
    Pick<Repository<ChatParticipant>, 'find' | 'save' | 'create'>
  >;
  let messagesRepository: jest.Mocked<
    Pick<Repository<Message>, 'findOne' | 'find'>
  >;

  let dataSource: { transaction: jest.Mock };

  const baseEvent: Event = {
    id: 'event-1',
    title: 'Meetup',
    body: 'Details here',
    createdById: 'user-1',
    groupChatId: 'group-1',
    chatId: 'event-chat-1',
    deletedAt: null,
    createdAt: new Date('2026-06-20T10:00:00.000Z'),
    updatedAt: new Date('2026-06-20T10:00:00.000Z'),
    createdBy: {} as Event['createdBy'],
    groupChat: {} as Event['groupChat'],
    chat: {} as Event['chat'],
    mediaItems: [],
  };

  beforeEach(async () => {
    eventsRepository = {
      findOne: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((value: Partial<Event>) => value as Event),
      save: jest
        .fn()
        .mockImplementation((value: Event) => Promise.resolve(value)),
      createQueryBuilder: jest.fn(),
    };

    chatsService = {
      getActiveParticipation: jest.fn().mockResolvedValue({
        role: ChatParticipantRole.MEMBER,
      }),
      getActiveParticipantUserIds: jest
        .fn()
        .mockResolvedValue(['user-1', 'user-2']),
      createEventChat: jest.fn().mockResolvedValue({ id: 'event-chat-1' }),
    };

    dataSource = {
      transaction: jest.fn((fn: (manager: unknown) => Promise<string>) => {
        const manager = {
          create: jest.fn(
            (_entity: unknown, plain: Partial<Event>) => plain as Event,
          ),
          save: jest.fn((entity: Event | EventMedia[]) => {
            if (Array.isArray(entity)) {
              return Promise.resolve(eventMediaRepository.save(entity));
            }

            return Promise.resolve(eventsRepository.save(entity));
          }),
        };

        return fn(manager);
      }),
    };

    mediaService = {
      assertOwnedUploadedMedia: jest.fn().mockResolvedValue({}),
      getPublicUrlForMediaId: jest.fn().mockResolvedValue(null),
      getDownloadUrlForUser: jest.fn().mockResolvedValue(null),
    };

    usersService = {
      findById: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Alice',
        avatarUrl: null,
        avatarMediaId: null,
      }),
    };

    eventMediaRepository = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest
        .fn()
        .mockImplementation(
          (value: Partial<EventMedia>) => value as EventMedia,
        ),
      save: jest.fn().mockResolvedValue([]),
    };

    chatsRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'group-1',
        title: 'Team',
        avatarMediaId: null,
        ownerId: 'user-1',
      }),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    participantsRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      create: jest
        .fn()
        .mockImplementation(
          (value: Partial<ChatParticipant>) => value as ChatParticipant,
        ),
    };

    messagesRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: eventsRepository },
        {
          provide: getRepositoryToken(EventMedia),
          useValue: eventMediaRepository,
        },
        { provide: getRepositoryToken(Chat), useValue: chatsRepository },
        {
          provide: getRepositoryToken(ChatParticipant),
          useValue: participantsRepository,
        },
        { provide: getRepositoryToken(Message), useValue: messagesRepository },
        { provide: ChatsService, useValue: chatsService },
        { provide: DataSource, useValue: dataSource },
        { provide: MediaService, useValue: mediaService },
        { provide: UsersService, useValue: usersService },
        {
          provide: RealtimeService,
          useValue: {
            leaveChatRoom: jest.fn(),
            emitToUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(EventsService);
  });

  it('creates event with dedicated chat', async () => {
    eventsRepository.save.mockResolvedValue(baseEvent);
    eventsRepository.findOne.mockResolvedValue(baseEvent);

    const result = await service.createEvent('user-1', {
      groupChatId: 'group-1',
      title: 'Meetup',
      body: 'Details here',
    });

    expect(chatsService.createEventChat).toHaveBeenCalledWith(
      'user-1',
      {
        title: 'Meetup',
        participantIds: ['user-2'],
      },
      expect.any(Object),
    );
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(result.id).toBe('event-1');
  });

  it('rejects edit from non-creator', async () => {
    eventsRepository.findOne.mockResolvedValue(baseEvent);

    await expect(
      service.updateEvent('user-2', 'event-1', { title: 'Changed' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows creator to delete event', async () => {
    eventsRepository.findOne.mockResolvedValue(baseEvent);

    const result = await service.deleteEvent('user-1', 'event-1');

    expect(result.success).toBe(true);
    const savedEvent = eventsRepository.save.mock.calls[0]?.[0] as Event;
    expect(savedEvent.deletedAt).toBeInstanceOf(Date);
  });

  it('throws when event is missing', async () => {
    eventsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getEventById('user-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
