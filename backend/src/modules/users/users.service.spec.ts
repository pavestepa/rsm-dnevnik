import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { MediaService } from '../media/media.service';
import { MediaKind, MediaStatus } from '../../common/enums';
import { Media } from '../media/entities/media.entity';

describe('UsersService avatar', () => {
  let service: UsersService;
  let usersRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let mediaService: jest.Mocked<
    Pick<
      MediaService,
      | 'assertOwnedUploadedMedia'
      | 'getPublicUrl'
      | 'getPublicUrlForMediaId'
      | 'getDownloadUrlForUser'
    >
  >;

  const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const mediaId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      save: jest.fn((user: User) => Promise.resolve(user)),
    };

    mediaService = {
      assertOwnedUploadedMedia: jest.fn(),
      getPublicUrl: jest.fn(),
      getPublicUrlForMediaId: jest.fn(),
      getDownloadUrlForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: MediaService, useValue: mediaService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('stores avatarUrl in postgres when avatarMediaId is set', async () => {
    const user = {
      id: userId,
      name: 'Alice',
      bio: null,
      phone: '+79001111111',
      avatarMediaId: null,
      avatarUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    const media = {
      id: mediaId,
      objectKey: `avatar/${userId}/file.jpg`,
      status: MediaStatus.UPLOADED,
      kind: MediaKind.AVATAR,
    } as Media;

    usersRepository.findOne.mockResolvedValue(user);
    mediaService.assertOwnedUploadedMedia.mockResolvedValue(media);
    mediaService.getPublicUrl.mockReturnValue(
      `http://localhost:9000/rsm-dnevnik/avatar/${userId}/file.jpg`,
    );

    const response = await service.update(userId, { avatarMediaId: mediaId });

    expect(mediaService.assertOwnedUploadedMedia).toHaveBeenCalledWith(
      mediaId,
      userId,
      MediaKind.AVATAR,
    );
    expect(usersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarMediaId: mediaId,
        avatarUrl: `http://localhost:9000/rsm-dnevnik/avatar/${userId}/file.jpg`,
      }),
    );
    expect(response.avatarUrl).toBe(
      `http://localhost:9000/rsm-dnevnik/avatar/${userId}/file.jpg`,
    );
  });

  it('clears avatarUrl when avatarMediaId is removed', async () => {
    const user = {
      id: userId,
      name: 'Alice',
      bio: null,
      phone: '+79001111111',
      avatarMediaId: mediaId,
      avatarUrl: 'http://localhost:9000/rsm-dnevnik/avatar/old.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    usersRepository.findOne.mockResolvedValue(user);

    const response = await service.update(userId, { avatarMediaId: null });

    expect(usersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarMediaId: null,
        avatarUrl: null,
      }),
    );
    expect(response.avatarUrl).toBeNull();
  });

  it('returns stored avatarUrl without presigning', async () => {
    const user = {
      id: userId,
      name: 'Alice',
      bio: null,
      phone: '+79001111111',
      avatarMediaId: mediaId,
      avatarUrl: 'http://localhost:9000/rsm-dnevnik/avatar/stored.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    usersRepository.findOne.mockResolvedValue(user);

    const response = await service.getById(userId, userId);

    expect(mediaService.getDownloadUrlForUser).not.toHaveBeenCalled();
    expect(response.avatarUrl).toBe(
      'http://localhost:9000/rsm-dnevnik/avatar/stored.jpg',
    );
  });

  it('throws when user is missing', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(userId, { avatarMediaId: mediaId }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
