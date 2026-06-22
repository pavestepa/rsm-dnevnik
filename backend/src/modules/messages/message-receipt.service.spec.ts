import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { MessageReceiptService } from './message-receipt.service';
import { Message } from './entities/message.entity';
import { MessageReceipt } from './entities/message-receipt.entity';
import { ChatParticipant } from '../chats/entities/chat-participant.entity';

describe('MessageReceiptService', () => {
  let service: MessageReceiptService;
  let messagesRepository: jest.Mocked<Pick<Repository<Message>, 'findOne'>>;
  let participantsRepository: jest.Mocked<
    Pick<Repository<ChatParticipant>, 'findOne'>
  >;
  let receiptsRepository: jest.Mocked<
    Pick<Repository<MessageReceipt>, 'findOne' | 'save' | 'create'>
  >;

  beforeEach(async () => {
    messagesRepository = { findOne: jest.fn() };
    participantsRepository = { findOne: jest.fn() };
    receiptsRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest
        .fn()
        .mockImplementation(
          (value: Partial<MessageReceipt>) => value as MessageReceipt,
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageReceiptService,
        {
          provide: getRepositoryToken(MessageReceipt),
          useValue: receiptsRepository,
        },
        {
          provide: getRepositoryToken(Message),
          useValue: messagesRepository,
        },
        {
          provide: getRepositoryToken(ChatParticipant),
          useValue: participantsRepository,
        },
      ],
    }).compile();

    service = module.get(MessageReceiptService);
  });

  it('forbids delivered receipt from non-participant', async () => {
    messagesRepository.findOne.mockResolvedValue({
      id: 'message-1',
      chatId: 'chat-1',
      senderId: 'sender-1',
    } as Message);
    participantsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.markDelivered('message-1', 'outsider-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
