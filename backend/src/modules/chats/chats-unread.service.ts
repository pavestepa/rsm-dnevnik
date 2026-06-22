import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class ChatsUnreadService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
  ) {}

  async getUnreadCount(
    chatId: string,
    userId: string,
    lastReadMessageId: string | null,
  ): Promise<number> {
    const qb = this.messagesRepository
      .createQueryBuilder('message')
      .where('message.chatId = :chatId', { chatId })
      .andWhere('message.senderId != :userId', { userId });

    if (lastReadMessageId) {
      qb.andWhere(
        `message.createdAt > COALESCE(
          (
            SELECT m."createdAt"
            FROM messages m
            WHERE m.id = :lastReadMessageId
              AND m."deletedAt" IS NULL
          ),
          to_timestamp(0)
        )`,
        { lastReadMessageId },
      );
    }

    return qb.getCount();
  }
}
