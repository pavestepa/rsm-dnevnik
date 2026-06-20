import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';

const TYPING_TTL_SECONDS = 5;

@Injectable()
export class TypingService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async startTyping(chatId: string, userId: string): Promise<void> {
    await this.redis.set(
      this.typingKey(chatId, userId),
      '1',
      'EX',
      TYPING_TTL_SECONDS,
    );
  }

  async stopTyping(chatId: string, userId: string): Promise<void> {
    await this.redis.del(this.typingKey(chatId, userId));
  }

  private typingKey(chatId: string, userId: string): string {
    return `typing:${chatId}:${userId}`;
  }
}
