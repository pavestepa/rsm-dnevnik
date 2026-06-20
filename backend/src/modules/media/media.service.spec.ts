import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { MediaService } from './media.service';
import { Media } from './entities/media.entity';
import { Message } from '../messages/entities/message.entity';
import { ChatParticipant } from '../chats/entities/chat-participant.entity';
import { Chat } from '../chats/entities/chat.entity';
import { User } from '../users/entities/user.entity';
import { S3Service } from './s3.service';
import { MediaKind, MediaStatus } from '../../common/enums';

describe('MediaService ACL', () => {
  let service: MediaService;
  let mediaRepository: jest.Mocked<Pick<Repository<Media>, 'findOne'>>;

  beforeEach(async () => {
    mediaRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getRepositoryToken(Media), useValue: mediaRepository },
        { provide: getRepositoryToken(Message), useValue: { findOne: jest.fn() } },
        {
          provide: getRepositoryToken(ChatParticipant),
          useValue: { findOne: jest.fn(), createQueryBuilder: jest.fn() },
        },
        { provide: getRepositoryToken(Chat), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn() } },
        {
          provide: S3Service,
          useValue: { getDownloadUrl: jest.fn(), getBucket: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(MediaService);
  });

  it('allows uploader access', async () => {
    mediaRepository.findOne.mockResolvedValue({
      id: 'media-1',
      uploadedById: 'user-1',
      status: MediaStatus.UPLOADED,
      kind: MediaKind.IMAGE,
    } as Media);

    await expect(service.canAccessMedia('media-1', 'user-1')).resolves.toBe(true);
  });

  it('denies outsider without shared context', async () => {
    mediaRepository.findOne.mockResolvedValue({
      id: 'media-1',
      uploadedById: 'user-1',
      status: MediaStatus.UPLOADED,
      kind: MediaKind.IMAGE,
    } as Media);

    await expect(service.canAccessMedia('media-1', 'user-2')).resolves.toBe(false);
  });
});
