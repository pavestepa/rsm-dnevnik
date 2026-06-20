import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';

@Injectable()
export class PresenceService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async add(userId: string, socketId: string): Promise<void> {
    await this.redis.sadd(this.presenceKey(userId), socketId);
  }

  async remove(userId: string, socketId: string): Promise<void> {
    await this.redis.srem(this.presenceKey(userId), socketId);
  }

  async isOnline(userId: string): Promise<boolean> {
    const count = await this.redis.scard(this.presenceKey(userId));
    return count > 0;
  }

  async getOnlineUserIds(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }

    const pipeline = this.redis.pipeline();
    for (const userId of userIds) {
      pipeline.scard(this.presenceKey(userId));
    }

    const results = await pipeline.exec();
    if (!results) {
      return [];
    }

    return userIds.filter((_, index) => {
      const [error, count] = results[index] ?? [];
      return !error && typeof count === 'number' && count > 0;
    });
  }

  private presenceKey(userId: string): string {
    return `presence:${userId}`;
  }
}
