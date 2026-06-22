import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { MessageReceipt } from '../messages/entities/message-receipt.entity';
import { Message } from '../messages/entities/message.entity';
import { ChatParticipant } from '../chats/entities/chat-participant.entity';
import {
  MessageDeliveryStatus,
  MessageReceiptStatus,
} from '../../common/enums';

@Injectable()
export class MessageReceiptService {
  constructor(
    @InjectRepository(MessageReceipt)
    private readonly receiptsRepository: Repository<MessageReceipt>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(ChatParticipant)
    private readonly participantsRepository: Repository<ChatParticipant>,
  ) {}

  async markDelivered(messageId: string, userId: string): Promise<void> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
    });

    if (!message || message.senderId === userId) {
      return;
    }

    const participation = await this.participantsRepository.findOne({
      where: { chatId: message.chatId, userId, leftAt: IsNull() },
    });

    if (!participation) {
      throw new ForbiddenException('Not a participant of this chat');
    }

    await this.upsertReceipt(messageId, userId, MessageReceiptStatus.DELIVERED);
  }

  async markDeliveredForOnlineRecipients(
    messageId: string,
    chatId: string,
    senderId: string,
    onlineUserIds: string[],
  ): Promise<void> {
    const recipients = onlineUserIds.filter((id) => id !== senderId);
    await Promise.all(
      recipients.map((userId) => this.markDelivered(messageId, userId)),
    );
  }

  async markReadUpTo(
    chatId: string,
    userId: string,
    targetMessage: Message,
  ): Promise<Message[]> {
    const messages = await this.messagesRepository
      .createQueryBuilder('message')
      .where('message.chatId = :chatId', { chatId })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.createdAt <= :createdAt', {
        createdAt: targetMessage.createdAt,
      })
      .andWhere('message.deletedAt IS NULL')
      .getMany();

    await Promise.all(
      messages.map((message) =>
        this.upsertReceipt(message.id, userId, MessageReceiptStatus.READ),
      ),
    );

    return messages;
  }

  async getAggregateStatus(
    message: Message,
    senderId: string,
  ): Promise<MessageDeliveryStatus> {
    const recipients = await this.getRecipientIds(message.chatId, senderId);

    if (recipients.length === 0) {
      return MessageDeliveryStatus.SENT;
    }

    const receipts = await this.receiptsRepository.find({
      where: {
        messageId: message.id,
        userId: In(recipients),
      },
    });

    const hasRead = receipts.some(
      (receipt) => receipt.status === MessageReceiptStatus.READ,
    );
    if (hasRead) {
      return MessageDeliveryStatus.READ;
    }

    const hasDelivered = receipts.some(
      (receipt) => receipt.status === MessageReceiptStatus.DELIVERED,
    );
    if (hasDelivered) {
      return MessageDeliveryStatus.DELIVERED;
    }

    return MessageDeliveryStatus.SENT;
  }

  async getAggregateStatusesForMessages(
    messages: Message[],
    senderId: string,
  ): Promise<Map<string, MessageDeliveryStatus>> {
    const result = new Map<string, MessageDeliveryStatus>();

    await Promise.all(
      messages.map(async (message) => {
        if (message.senderId !== senderId) {
          return;
        }
        result.set(
          message.id,
          await this.getAggregateStatus(message, senderId),
        );
      }),
    );

    return result;
  }

  private async getRecipientIds(
    chatId: string,
    senderId: string,
  ): Promise<string[]> {
    const participants = await this.participantsRepository.find({
      where: { chatId },
    });

    return participants
      .filter(
        (participant) => !participant.leftAt && participant.userId !== senderId,
      )
      .map((participant) => participant.userId);
  }

  private async upsertReceipt(
    messageId: string,
    userId: string,
    status: MessageReceiptStatus,
  ): Promise<void> {
    const existing = await this.receiptsRepository.findOne({
      where: { messageId, userId },
    });

    if (existing) {
      if (
        existing.status === MessageReceiptStatus.READ ||
        (existing.status === MessageReceiptStatus.DELIVERED &&
          status === MessageReceiptStatus.DELIVERED)
      ) {
        return;
      }

      existing.status = status;
      await this.receiptsRepository.save(existing);
      return;
    }

    await this.receiptsRepository.save(
      this.receiptsRepository.create({
        messageId,
        userId,
        status,
      }),
    );
  }
}
