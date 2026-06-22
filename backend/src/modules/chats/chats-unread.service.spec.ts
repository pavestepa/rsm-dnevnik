import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Message } from '../messages/entities/message.entity';
import { ChatsUnreadService } from './chats-unread.service';

describe('ChatsUnreadService', () => {
  let service: ChatsUnreadService;
  let messagesRepository: jest.Mocked<
    Pick<Repository<Message>, 'createQueryBuilder'>
  >;
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getCount: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(3),
    };

    messagesRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsUnreadService,
        {
          provide: getRepositoryToken(Message),
          useValue: messagesRepository,
        },
      ],
    }).compile();

    service = module.get(ChatsUnreadService);
  });

  it('counts unread messages excluding own messages', async () => {
    const count = await service.getUnreadCount('chat-1', 'user-1', null);

    expect(count).toBe(3);
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'message.chatId = :chatId',
      {
        chatId: 'chat-1',
      },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'message.senderId != :userId',
      { userId: 'user-1' },
    );
  });

  it('filters by lastReadMessageId when provided', async () => {
    await service.getUnreadCount('chat-1', 'user-1', 'msg-read');

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('lastReadMessageId'),
      { lastReadMessageId: 'msg-read' },
    );
  });

  it('returns zero for empty chats', async () => {
    queryBuilder.getCount.mockResolvedValue(0);

    const count = await service.getUnreadCount('chat-1', 'user-1', null);

    expect(count).toBe(0);
  });
});
