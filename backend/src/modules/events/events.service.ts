import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { EventMedia } from './entities/event-media.entity';
import { Chat } from '../chats/entities/chat.entity';
import { ChatParticipant } from '../chats/entities/chat-participant.entity';
import { Message } from '../messages/entities/message.entity';
import { ChatsService } from '../chats/chats.service';
import { MediaService } from '../media/media.service';
import { UsersService } from '../users/users.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SocketEvents } from '../realtime/socket-events';
import {
  CreateEventDto,
  EventDetailDto,
  EventListItemDto,
  UpdateEventDto,
} from './dto/event.dto';
import {
  ChatParticipantRole,
  EventMediaKind,
  MediaKind,
} from '../../common/enums';
import {
  CursorPaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

const BODY_PREVIEW_LENGTH = 100;

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(EventMedia)
    private readonly eventMediaRepository: Repository<EventMedia>,
    @InjectRepository(Chat)
    private readonly chatsRepository: Repository<Chat>,
    @InjectRepository(ChatParticipant)
    private readonly participantsRepository: Repository<ChatParticipant>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    private readonly chatsService: ChatsService,
    private readonly mediaService: MediaService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => RealtimeService))
    private readonly realtimeService: RealtimeService,
  ) {}

  async listEvents(
    userId: string,
    pagination: CursorPaginationDto,
  ): Promise<PaginatedResult<EventListItemDto>> {
    const limit = pagination.limit ?? 50;

    const qb = this.eventsRepository
      .createQueryBuilder('event')
      .innerJoin(
        ChatParticipant,
        'participant',
        'participant.chatId = event.groupChatId AND participant.userId = :userId AND participant.leftAt IS NULL',
        { userId },
      )
      .where('event.deletedAt IS NULL')
      .orderBy('event.createdAt', 'DESC')
      .take(limit + 1);

    if (pagination.cursor) {
      const cursorEvent = await this.eventsRepository.findOne({
        where: { id: pagination.cursor },
      });

      if (!cursorEvent) {
        throw new NotFoundException('Cursor event not found');
      }

      qb.andWhere('event.createdAt < :cursorCreatedAt', {
        cursorCreatedAt: cursorEvent.createdAt,
      });
    }

    const events = await qb.getMany();
    const hasMore = events.length > limit;
    const pageItems = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;

    const items = await Promise.all(
      pageItems.map((event) => this.toListItem(event, userId)),
    );

    return new PaginatedResult(items, nextCursor);
  }

  async getEventById(userId: string, eventId: string): Promise<EventDetailDto> {
    const event = await this.getAccessibleEvent(eventId, userId);
    return this.toDetail(event, userId);
  }

  async createEvent(
    userId: string,
    dto: CreateEventDto,
  ): Promise<EventDetailDto> {
    await this.chatsService.getActiveParticipation(dto.groupChatId, userId);

    const participantIds = await this.chatsService.getActiveParticipantUserIds(
      dto.groupChatId,
    );
    const otherParticipantIds = participantIds.filter((id) => id !== userId);

    await this.validateEventMedia(userId, dto.media ?? []);

    const eventId = await this.dataSource.transaction(async (manager) => {
      const chatDetail = await this.chatsService.createEventChat(
        userId,
        {
          title: dto.title,
          participantIds: otherParticipantIds,
        },
        manager,
      );

      const event = await manager.save(
        manager.create(Event, {
          title: dto.title,
          body: dto.body,
          createdById: userId,
          groupChatId: dto.groupChatId,
          chatId: chatDetail.id,
        }),
      );

      await this.saveEventMedia(event.id, dto.media ?? [], manager);

      return event.id;
    });

    return this.getEventById(userId, eventId);
  }

  async updateEvent(
    userId: string,
    eventId: string,
    dto: UpdateEventDto,
  ): Promise<EventDetailDto> {
    const event = await this.getAccessibleEvent(eventId, userId);

    if (event.createdById !== userId) {
      throw new ForbiddenException(
        'Only the event creator can edit this event',
      );
    }

    if (dto.groupChatId && dto.groupChatId !== event.groupChatId) {
      await this.chatsService.getActiveParticipation(dto.groupChatId, userId);
      event.groupChatId = dto.groupChatId;
      await this.syncEventChatParticipants(event);
    }

    if (dto.title !== undefined) {
      event.title = dto.title;
      await this.chatsRepository.update(event.chatId, { title: dto.title });
      await this.notifyEventChatUpdated(event.chatId);
    }

    if (dto.body !== undefined) {
      event.body = dto.body;
    }

    if (dto.media !== undefined) {
      await this.validateEventMedia(userId, dto.media);
      await this.eventMediaRepository.delete({ eventId: event.id });
      await this.saveEventMedia(event.id, dto.media);
    }

    await this.eventsRepository.save(event);

    return this.getEventById(userId, event.id);
  }

  async deleteEvent(
    userId: string,
    eventId: string,
  ): Promise<{ success: true }> {
    const event = await this.getAccessibleEvent(eventId, userId);

    if (!(await this.canDeleteEvent(userId, event))) {
      throw new ForbiddenException('You cannot delete this event');
    }

    event.deletedAt = new Date();
    await this.eventsRepository.save(event);
    await this.softDeleteChat(event.chatId);

    return { success: true };
  }

  private async getAccessibleEvent(
    eventId: string,
    userId: string,
  ): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId, deletedAt: IsNull() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.chatsService.getActiveParticipation(event.groupChatId, userId);

    return event;
  }

  private async canDeleteEvent(userId: string, event: Event): Promise<boolean> {
    if (event.createdById === userId) {
      return true;
    }

    const chat = await this.chatsRepository.findOne({
      where: { id: event.groupChatId },
    });

    if (!chat) {
      return false;
    }

    const participation = await this.chatsService.getActiveParticipation(
      event.groupChatId,
      userId,
    );

    return (
      chat.ownerId === userId ||
      participation.role === ChatParticipantRole.ADMIN
    );
  }

  private async validateEventMedia(
    userId: string,
    media: CreateEventDto['media'],
  ): Promise<void> {
    for (const item of media ?? []) {
      const expectedKind =
        item.kind === 'image' ? MediaKind.IMAGE : MediaKind.DOCUMENT;
      await this.mediaService.assertOwnedUploadedMedia(
        item.mediaId,
        userId,
        expectedKind,
      );
    }
  }

  private async saveEventMedia(
    eventId: string,
    media: NonNullable<CreateEventDto['media']>,
    manager?: EntityManager,
  ): Promise<void> {
    if (media.length === 0) {
      return;
    }

    const eventMediaRepository = manager
      ? manager.getRepository(EventMedia)
      : this.eventMediaRepository;

    const rows = media.map((item, index) =>
      eventMediaRepository.create({
        eventId,
        mediaId: item.mediaId,
        kind:
          item.kind === 'image' ? EventMediaKind.IMAGE : EventMediaKind.FILE,
        sortOrder: index,
        fileName: item.fileName ?? null,
      }),
    );

    await eventMediaRepository.save(rows);
  }

  private async syncEventChatParticipants(event: Event): Promise<void> {
    const targetUserIds = await this.chatsService.getActiveParticipantUserIds(
      event.groupChatId,
    );
    const targetSet = new Set(targetUserIds);

    const currentParticipants = await this.participantsRepository.find({
      where: { chatId: event.chatId },
    });

    for (const participant of currentParticipants) {
      if (!participant.leftAt && !targetSet.has(participant.userId)) {
        participant.leftAt = new Date();
        await this.participantsRepository.save(participant);
        this.realtimeService.leaveChatRoom(participant.userId, event.chatId);
        this.realtimeService.emitToUser(
          participant.userId,
          SocketEvents.CHAT_UPDATED,
          {
            chatId: event.chatId,
          },
        );
      }
    }

    for (const userId of targetUserIds) {
      const existing = currentParticipants.find(
        (participant) => participant.userId === userId,
      );

      if (existing?.leftAt) {
        existing.leftAt = null;
        existing.role = ChatParticipantRole.MEMBER;
        await this.participantsRepository.save(existing);
        this.realtimeService.emitToUser(userId, SocketEvents.CHAT_UPDATED, {
          chatId: event.chatId,
        });
        continue;
      }

      if (!existing) {
        await this.participantsRepository.save(
          this.participantsRepository.create({
            chatId: event.chatId,
            userId,
            role: ChatParticipantRole.MEMBER,
          }),
        );
        this.realtimeService.emitToUser(userId, SocketEvents.CHAT_UPDATED, {
          chatId: event.chatId,
        });
      }
    }
  }

  private async notifyEventChatUpdated(chatId: string): Promise<void> {
    const participants = await this.participantsRepository.find({
      where: { chatId, leftAt: IsNull() },
    });

    for (const participant of participants) {
      this.realtimeService.emitToUser(
        participant.userId,
        SocketEvents.CHAT_UPDATED,
        { chatId },
      );
    }
  }

  private async softDeleteChat(chatId: string): Promise<void> {
    const chat = await this.chatsRepository.findOne({ where: { id: chatId } });

    if (!chat || chat.deletedAt) {
      return;
    }

    chat.deletedAt = new Date();
    await this.chatsRepository.save(chat);

    const participants = await this.participantsRepository.find({
      where: { chatId, leftAt: IsNull() },
    });

    for (const participant of participants) {
      participant.leftAt = new Date();
      await this.participantsRepository.save(participant);
      this.realtimeService.leaveChatRoom(participant.userId, chatId);
      this.realtimeService.emitToUser(
        participant.userId,
        SocketEvents.CHAT_DELETED,
        {
          chatId,
        },
      );
    }
  }

  private async toListItem(
    event: Event,
    userId: string,
  ): Promise<EventListItemDto> {
    const detail = await this.toDetail(event, userId);
    return detail;
  }

  private async toDetail(
    event: Event,
    userId: string,
  ): Promise<EventDetailDto> {
    const [author, groupChat, mediaItems, chatPreview, canDelete] =
      await Promise.all([
        this.usersService.findById(event.createdById),
        this.chatsRepository.findOne({
          where: { id: event.groupChatId },
          relations: { avatarMedia: true },
        }),
        this.eventMediaRepository.find({
          where: { eventId: event.id },
          relations: { media: true },
          order: { sortOrder: 'ASC' },
        }),
        this.buildChatPreview(event.chatId),
        this.canDeleteEvent(userId, event),
      ]);

    if (!author || !groupChat) {
      throw new NotFoundException('Event data is incomplete');
    }

    const groupAvatarUrl = groupChat.avatarMediaId
      ? await this.mediaService.getPublicUrlForMediaId(groupChat.avatarMediaId)
      : null;

    const authorAvatarUrl = author.avatarMediaId
      ? await this.mediaService.getPublicUrlForMediaId(author.avatarMediaId)
      : author.avatarUrl;

    const imageItems = mediaItems.filter(
      (item) => item.kind === EventMediaKind.IMAGE,
    );
    const fileItems = mediaItems.filter(
      (item) => item.kind === EventMediaKind.FILE,
    );

    const images = await Promise.all(
      imageItems.slice(0, 4).map(async (item) => ({
        id: item.mediaId,
        url:
          (await this.mediaService.getDownloadUrlForUser(
            item.mediaId,
            userId,
          )) ?? '',
      })),
    );

    const files = await Promise.all(
      fileItems.map(async (item) => ({
        id: item.mediaId,
        fileName: item.fileName ?? item.media.mimeType,
        mimeType: item.media.mimeType,
        downloadUrl: await this.mediaService.getDownloadUrlForUser(
          item.mediaId,
          userId,
        ),
      })),
    );

    return {
      id: event.id,
      title: event.title,
      body: event.body,
      bodyPreview: this.truncateBody(event.body),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      author: {
        id: author.id,
        name: author.name,
        avatarUrl: authorAvatarUrl,
      },
      group: {
        id: groupChat.id,
        title: groupChat.title ?? '',
        avatarUrl: groupAvatarUrl,
      },
      images,
      totalImages: imageItems.length,
      filesCount: fileItems.length,
      files,
      chatId: event.chatId,
      chatPreview,
      canEdit: event.createdById === userId,
      canDelete,
    };
  }

  private async buildChatPreview(
    chatId: string,
  ): Promise<EventDetailDto['chatPreview']> {
    const lastMessage = await this.messagesRepository.findOne({
      where: { chatId, deletedAt: IsNull() },
      relations: { sender: true },
      order: { createdAt: 'DESC' },
    });

    const recentMessages = await this.messagesRepository.find({
      where: { chatId, deletedAt: IsNull() },
      relations: { sender: true },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const seenSenderIds = new Set<string>();
    const writerAvatars: EventDetailDto['chatPreview']['writerAvatars'] = [];

    for (const message of recentMessages) {
      if (seenSenderIds.has(message.senderId)) {
        continue;
      }

      seenSenderIds.add(message.senderId);
      const avatarUrl = message.sender.avatarMediaId
        ? await this.mediaService.getPublicUrlForMediaId(
            message.sender.avatarMediaId,
          )
        : message.sender.avatarUrl;

      writerAvatars.push({
        id: message.sender.id,
        name: message.sender.name,
        avatarUrl,
      });

      if (writerAvatars.length >= 3) {
        break;
      }
    }

    return {
      lastMessage: lastMessage
        ? {
            text: lastMessage.text,
            createdAt: lastMessage.createdAt,
          }
        : null,
      writerAvatars,
    };
  }

  private truncateBody(body: string): string {
    if (body.length <= BODY_PREVIEW_LENGTH) {
      return body;
    }

    return body.slice(0, BODY_PREVIEW_LENGTH).trimEnd();
  }
}
