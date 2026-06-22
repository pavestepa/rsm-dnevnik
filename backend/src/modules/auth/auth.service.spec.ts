import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findByLoginOrPhone' | 'findById' | 'toResponse'>
  >;
  let refreshTokensRepository: jest.Mocked<
    Pick<Repository<RefreshToken>, 'findOne' | 'save' | 'create'>
  >;

  const user: User = {
    id: 'user-1',
    login: 'alice',
    passwordHash: bcrypt.hashSync('password123', 10),
    name: 'alice',
    phone: null,
    bio: null,
    avatarMediaId: null,
    avatarUrl: null,
    avatarMedia: null,
    isActive: true,
    chatParticipants: [],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findByLoginOrPhone: jest.fn(),
      findById: jest.fn(),
      toResponse: jest.fn(),
    };

    refreshTokensRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest
        .fn()
        .mockImplementation(
          (value: Partial<RefreshToken>) => value as RefreshToken,
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('access-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'auth.accessTokenExpiresIn') return 900;
              if (key === 'auth.accessTokenSecret') return 'test-secret';
              if (key === 'auth.refreshTokenExpiresInDays') return 7;
              return undefined;
            }),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokensRepository,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('returns tokens for valid login', async () => {
    usersService.findByLoginOrPhone.mockResolvedValue(user);
    usersService.toResponse.mockResolvedValue({
      id: user.id,
      name: user.name,
      phone: null,
      bio: null,
      avatarMediaId: null,
      avatarUrl: null,
      isActive: true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    refreshTokensRepository.save.mockResolvedValue({} as RefreshToken);

    const result = await service.login(
      { login: 'alice', password: 'password123' },
      '127.0.0.1',
    );

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBeDefined();
  });

  it('rejects invalid password', async () => {
    usersService.findByLoginOrPhone.mockResolvedValue(user);

    await expect(
      service.login({ login: 'alice', password: 'wrong' }, '127.0.0.1'),
    ).rejects.toThrow('Invalid login or password');
  });

  it('rotates refresh token', async () => {
    usersService.findById.mockResolvedValue(user);
    refreshTokensRepository.findOne.mockResolvedValue({
      id: 'token-1',
      userId: user.id,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    } as RefreshToken);
    refreshTokensRepository.save.mockResolvedValue({} as RefreshToken);

    const result = await service.refresh('refresh-token-value');

    expect(result.accessToken).toBe('access-token');
    expect(refreshTokensRepository.save).toHaveBeenCalled();
  });
});
