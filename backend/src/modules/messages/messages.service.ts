import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ChatParticipant } from '../chats/entities/chat-participant.entity';
import { ChatsService } from '../chats/chats.service';
import { MediaService } from '../media/media.service';
import { UsersService } from '../users/users.service';
import { MessageReceiptService } from './message-receipt.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PresenceService } from '../realtime/presence.service';
import { SocketEvents } from '../realtime/socket-events';
import {
  CreateMessageDto,
  MarkChatReadDto,
  MessageResponseDto,
  UpdateMessageDto,
} from './dto/message.dto';
import { MessageDeliveryStatus, MessageType } from '../../common/enums';
import {
  CursorPaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { PushService } from '../push/push.service';

const EDIT_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(ChatParticipant)
    private readonly participantsRepository: Repository<ChatParticipant>,
    private readonly chatsService: ChatsService,
    private readonly mediaService: MediaService,
    private readonly usersService: UsersService,
    private readonly messageReceiptService: MessageReceiptService,
    @Inject(forwardRef(() => RealtimeService))
    private readonly realtimeService: RealtimeService,
    private readonly presenceService: PresenceService,
    private readonly pushService: PushService,
  ) {}

  async listMessages(
    userId: string,
    chatId: string,
    pagination: CursorPaginationDto,
  ): Promise<PaginatedResult<MessageResponseDto>> {
    await this.chatsService.getActiveParticipation(chatId, userId);

    const limit = pagination.limit ?? 50;
    const qb = this.messagesRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.media', 'media')
      .where('message.chatId = :chatId', { chatId })
      .andWhere('message.deletedAt IS NULL')
      .orderBy('message.createdAt', 'DESC')
      .take(limit + 1);

    if (pagination.cursor) {
      const cursorMessage = await this.messagesRepository.findOne({
        where: { id: pagination.cursor, chatId },
      });

      if (!cursorMessage) {
        throw new NotFoundException('Cursor message not found');
      }

      qb.andWhere('message.createdAt < :cursorCreatedAt', {
        cursorCreatedAt: cursorMessage.createdAt,
      });
    }

    const messages = await qb.getMany();
    const hasMore = messages.length > limit;
    const pageItems = hasMore ? messages.slice(0, limit) : messages;

    const items = await Promise.all(
      pageItems.map((message) => this.toResponse(message, userId)),
    );

    const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;

    return new PaginatedResult(items.reverse(), nextCursor);
  }

  async createMessage(
    userId: string,
    chatId: string,
    dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    await this.chatsService.getActiveParticipation(chatId, userId);
    this.validateMessagePayload(dto);

    let mediaId: string | null = null;

    if (
      dto.type === MessageType.IMAGE ||
      dto.type === MessageType.VIDEO ||
      dto.type === MessageType.AUDIO
    ) {
      await this.mediaService.assertMessageMedia(
        dto.mediaId!,
        userId,
        dto.type,
      );
      mediaId = dto.mediaId!;
    }

    if (dto.replyToId) {
      const replyMessage = await this.messagesRepository.findOne({
        where: { id: dto.replyToId, chatId },
      });

      if (!replyMessage) {
        throw new NotFoundException('Reply message not found in this chat');
      }
    }

    const message = await this.messagesRepository.save(
      this.messagesRepository.create({
        chatId,
        senderId: userId,
        type: dto.type,
        text:
          dto.type === MessageType.TEXT
            ? dto.text!.trim()
            : (dto.caption?.trim() ?? null),
        mediaId,
        replyToId: dto.replyToId ?? null,
      }),
    );

    await this.chatsService.touchChat(chatId);

    await this.participantsRepository.update(
      { chatId, userId },
      { lastReadMessageId: message.id },
    );

    const saved = await this.messagesRepository.findOne({
      where: { id: message.id },
      relations: { sender: true, media: true },
    });

    const response = await this.toResponse(saved!, userId);

    const participantIds =
      await this.chatsService.getActiveParticipantUserIds(chatId);
    const onlineRecipients = await this.presenceService.getOnlineUserIds(
      participantIds.filter((id) => id !== userId),
    );

    await this.messageReceiptService.markDeliveredForOnlineRecipients(
      message.id,
      chatId,
      userId,
      onlineRecipients,
    );

    const status = await this.messageReceiptService.getAggregateStatus(
      saved!,
      userId,
    );
    response.status = status;

    this.realtimeService.emitToChat(chatId, SocketEvents.MESSAGE_NEW, response);
    this.realtimeService.emitToUser(userId, SocketEvents.MESSAGE_STATUS, {
      messageId: message.id,
      chatId,
      status,
    });

    for (const recipientId of onlineRecipients) {
      const participation = await this.chatsService.getActiveParticipation(
        chatId,
        recipientId,
      );
      const unreadCount = await this.chatsService.getUnreadCount(
        chatId,
        recipientId,
        participation.lastReadMessageId,
      );

      this.realtimeService.emitToUser(recipientId, SocketEvents.CHAT_UPDATED, {
        chatId,
        unreadCount,
      });
    }

    const offlineRecipients = participantIds.filter(
      (id) => id !== userId && !onlineRecipients.includes(id),
    );
    await this.pushService.sendNewMessageNotification(offlineRecipients, {
      chatId,
      messageId: message.id,
      senderName: response.sender.name,
      preview: response.text ?? `[${response.type}]`,
    });

    return response;
  }

  async updateMessage(
    userId: string,
    chatId: string,
    messageId: string,
    dto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    await this.chatsService.getActiveParticipation(chatId, userId);

    const message = await this.messagesRepository.findOne({
      where: { id: messageId, chatId },
      relations: { sender: true, media: true },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Only the sender can edit this message');
    }

    if (message.type !== MessageType.TEXT) {
      throw new BadRequestException('Only text messages can be edited');
    }

    if (Date.now() - message.createdAt.getTime() > EDIT_WINDOW_MS) {
      throw new BadRequestException('Edit window has expired');
    }

    message.text = dto.text.trim();
    message.editedAt = new Date();
    const saved = await this.messagesRepository.save(message);
    const response = await this.toResponse(saved, userId);

    this.realtimeService.emitToChat(
      chatId,
      SocketEvents.MESSAGE_UPDATED,
      response,
    );
    return response;
  }

  async deleteMessage(
    userId: string,
    chatId: string,
    messageId: string,
  ): Promise<{ success: true }> {
    await this.chatsService.getActiveParticipation(chatId, userId);

    const message = await this.messagesRepository.findOne({
      where: { id: messageId, chatId },
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    const canDelete = await this.chatsService.canDeleteMessage(
      userId,
      chatId,
      message,
    );

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this message');
    }

    message.deletedAt = new Date();
    await this.messagesRepository.save(message);

    this.realtimeService.emitToChat(chatId, SocketEvents.MESSAGE_DELETED, {
      chatId,
      messageId,
    });

    return { success: true };
  }

  async searchMessages(
    userId: string,
    chatId: string,
    query: string,
    pagination: CursorPaginationDto,
  ): Promise<PaginatedResult<MessageResponseDto>> {
    await this.chatsService.getActiveParticipation(chatId, userId);

    const limit = pagination.limit ?? 50;
    const qb = this.messagesRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.media', 'media')
      .where('message.chatId = :chatId', { chatId })
      .andWhere('message.deletedAt IS NULL')
      .andWhere('message.text ILIKE :query', { query: `%${query}%` })
      .orderBy('message.createdAt', 'DESC')
      .take(limit + 1);

    if (pagination.cursor) {
      const cursorMessage = await this.messagesRepository.findOne({
        where: { id: pagination.cursor, chatId },
      });

      if (!cursorMessage) {
        throw new NotFoundException('Cursor message not found');
      }

      qb.andWhere('message.createdAt < :cursorCreatedAt', {
        cursorCreatedAt: cursorMessage.createdAt,
      });
    }

    const messages = await qb.getMany();
    const hasMore = messages.length > limit;
    const pageItems = hasMore ? messages.slice(0, limit) : messages;

    const items = await Promise.all(
      pageItems.map((message) => this.toResponse(message, userId)),
    );

    const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;
    return new PaginatedResult(items.reverse(), nextCursor);
  }

  async markChatAsRead(
    userId: string,
    chatId: string,
    dto: MarkChatReadDto,
  ): Promise<{ unreadCount: number }> {
    const participation = await this.chatsService.getActiveParticipation(
      chatId,
      userId,
    );

    let targetMessage: Message | null = null;

    if (dto.messageId) {
      targetMessage = await this.messagesRepository.findOne({
        where: { id: dto.messageId, chatId },
      });

      if (!targetMessage) {
        throw new NotFoundException('Message not found in this chat');
      }
    } else {
      targetMessage = await this.messagesRepository.findOne({
        where: { chatId },
        order: { createdAt: 'DESC' },
      });
    }

    if (targetMessage) {
      participation.lastReadMessageId = targetMessage.id;
      await this.participantsRepository.save(participation);

      const affectedMessages = await this.messageReceiptService.markReadUpTo(
        chatId,
        userId,
        targetMessage,
      );

      await Promise.all(
        affectedMessages.map((message) => this.notifyStatusUpdate(message.id)),
      );
    }

    const unreadCount = await this.chatsService.getUnreadCount(
      chatId,
      userId,
      participation.lastReadMessageId,
    );

    this.realtimeService.emitToUser(userId, SocketEvents.CHAT_UPDATED, {
      chatId,
      unreadCount,
    });

    return { unreadCount };
  }

  async notifyStatusUpdate(messageId: string): Promise<void> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      return;
    }

    const status = await this.messageReceiptService.getAggregateStatus(
      message,
      message.senderId,
    );

    this.realtimeService.emitToUser(
      message.senderId,
      SocketEvents.MESSAGE_STATUS,
      {
        messageId: message.id,
        chatId: message.chatId,
        status,
      },
    );
  }

  private validateMessagePayload(dto: CreateMessageDto): void {
    if (dto.type === MessageType.TEXT) {
      if (!dto.text?.trim()) {
        throw new BadRequestException('Text is required for text messages');
      }
      return;
    }

    if (!dto.mediaId) {
      throw new BadRequestException('mediaId is required for media messages');
    }
  }

  private async toResponse(
    message: Message,
    viewerId: string,
  ): Promise<MessageResponseDto> {
    const sender =
      message.sender ?? (await this.usersService.findById(message.senderId));
    const senderResponse = sender
      ? await this.usersService.toResponse(sender, viewerId)
      : null;

    let media = null;
    if (message.mediaId && message.media) {
      let url: string | null = null;
      try {
        url = await this.mediaService.getDownloadUrlForUser(
          message.media.id,
          viewerId,
        );
      } catch {
        url = null;
      }

      media = {
        id: message.media.id,
        mimeType: message.media.mimeType,
        size: message.media.size,
        url,
        durationSeconds: message.media.durationSeconds,
      };
    }

    let status: MessageDeliveryStatus | null = null;
    if (message.senderId === viewerId) {
      status = await this.messageReceiptService.getAggregateStatus(
        message,
        viewerId,
      );
    }

    return {
      id: message.id,
      chatId: message.chatId,
      type: message.type,
      text: message.text,
      media,
      sender: {
        id: message.senderId,
        name: senderResponse?.name ?? 'Unknown',
        avatarUrl: senderResponse?.avatarUrl ?? null,
      },
      replyToId: message.replyToId,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
      status,
    };
  }
}
