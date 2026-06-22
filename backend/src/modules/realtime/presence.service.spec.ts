import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { PresenceService } from './presence.service';

describe('PresenceService', () => {
  let service: PresenceService;
  let redis: jest.Mocked<Pick<Redis, 'sadd' | 'srem' | 'scard' | 'pipeline'>>;

  beforeEach(async () => {
    redis = {
      sadd: jest.fn().mockResolvedValue(1),
      srem: jest.fn().mockResolvedValue(1),
      scard: jest.fn().mockResolvedValue(2),
      pipeline: jest.fn().mockReturnValue({
        scard: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1],
          [null, 0],
        ]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PresenceService, { provide: REDIS_CLIENT, useValue: redis }],
    }).compile();

    service = module.get(PresenceService);
  });

  it('adds socket to presence set', async () => {
    await service.add('user-1', 'socket-1');

    expect(redis.sadd).toHaveBeenCalledWith('presence:user-1', 'socket-1');
  });

  it('removes socket from presence set', async () => {
    await service.remove('user-1', 'socket-1');

    expect(redis.srem).toHaveBeenCalledWith('presence:user-1', 'socket-1');
  });

  it('returns online when presence set is non-empty', async () => {
    await expect(service.isOnline('user-1')).resolves.toBe(true);
  });

  it('returns offline users from batch lookup', async () => {
    const online = await service.getOnlineUserIds(['user-1', 'user-2']);

    expect(online).toEqual(['user-1']);
  });
});
