import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { Message } from '../messages/entities/message.entity';
import { UsersService } from '../users/users.service';
import { MediaService } from '../media/media.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PresenceService } from '../realtime/presence.service';
import { SocketEvents } from '../realtime/socket-events';
import {
  ChatDetailDto,
  ChatLastMessageDto,
  ChatListItemDto,
  ChatParticipantDto,
  CreateDirectChatDto,
  CreateEventChatDto,
  CreateGroupChatDto,
  UpdateGroupChatDto,
} from './dto/chat.dto';
import { ChatsUnreadService } from './chats-unread.service';
import { ChatParticipantRole, ChatType } from '../../common/enums';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatsRepository: Repository<Chat>,
    @InjectRepository(ChatParticipant)
    private readonly participantsRepository: Repository<ChatParticipant>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
    @Inject(forwardRef(() => RealtimeService))
    private readonly realtimeService: RealtimeService,
    @Inject(forwardRef(() => PresenceService))
    private readonly presenceService: PresenceService,
    private readonly chatsUnreadService: ChatsUnreadService,
  ) {}

  async createDirectChat(
    userId: string,
    dto: CreateDirectChatDto,
  ): Promise<ChatDetailDto> {
    if (userId === dto.participantId) {
      throw new BadRequestException('Cannot create direct chat with yourself');
    }

    const otherUser = await this.usersService.findById(dto.participantId);
    if (!otherUser) {
      throw new NotFoundException('Participant not found');
    }

    const existing = await this.findExistingDirectChat(
      userId,
      dto.participantId,
    );
    if (existing) {
      return this.toChatDetail(existing, userId);
    }

    const chat = await this.chatsRepository.save(
      this.chatsRepository.create({
        type: ChatType.DIRECT,
        title: null,
        createdById: userId,
        ownerId: null,
      }),
    );

    await this.participantsRepository.save([
      this.participantsRepository.create({
        chatId: chat.id,
        userId,
        role: ChatParticipantRole.MEMBER,
      }),
      this.participantsRepository.create({
        chatId: chat.id,
        userId: dto.participantId,
        role: ChatParticipantRole.MEMBER,
      }),
    ]);

    return this.getChatById(userId, chat.id);
  }

  async createGroupChat(
    userId: string,
    dto: CreateGroupChatDto,
  ): Promise<ChatDetailDto> {
    const participantIds = [...new Set([userId, ...dto.participantIds])];
    const users = await Promise.all(
      participantIds.map((id) => this.usersService.findById(id)),
    );

    if (users.some((user) => !user)) {
      throw new NotFoundException('One or more participants not found');
    }

    if (dto.avatarMediaId) {
      await this.mediaService.assertOwnedUploadedMedia(
        dto.avatarMediaId,
        userId,
      );
    }

    const chat = await this.chatsRepository.save(
      this.chatsRepository.create({
        type: ChatType.GROUP,
        title: dto.title,
        avatarMediaId: dto.avatarMediaId ?? null,
        createdById: userId,
        ownerId: userId,
      }),
    );

    await this.participantsRepository.save(
      participantIds.map((participantId) =>
        this.participantsRepository.create({
          chatId: chat.id,
          userId: participantId,
          role:
            participantId === userId
              ? ChatParticipantRole.ADMIN
              : ChatParticipantRole.MEMBER,
        }),
      ),
    );

    return this.getChatById(userId, chat.id);
  }

  async createEventChat(
    userId: string,
    dto: CreateEventChatDto,
    manager?: EntityManager,
  ): Promise<{ id: string }> {
    const chatsRepository = manager
      ? manager.getRepository(Chat)
      : this.chatsRepository;
    const participantsRepository = manager
      ? manager.getRepository(ChatParticipant)
      : this.participantsRepository;

    const participantIds = [...new Set([userId, ...dto.participantIds])];
    const users = await Promise.all(
      participantIds.map((id) => this.usersService.findById(id)),
    );

    if (users.some((user) => !user)) {
      throw new NotFoundException('One or more participants not found');
    }

    const chat = await chatsRepository.save(
      chatsRepository.create({
        type: ChatType.EVENT,
        title: dto.title,
        avatarMediaId: null,
        createdById: userId,
        ownerId: userId,
      }),
    );

    await participantsRepository.save(
      participantIds.map((participantId) =>
        participantsRepository.create({
          chatId: chat.id,
          userId: participantId,
          role:
            participantId === userId
              ? ChatParticipantRole.ADMIN
              : ChatParticipantRole.MEMBER,
        }),
      ),
    );

    return { id: chat.id };
  }

  async listChats(userId: string, query?: string): Promise<ChatListItemDto[]> {
    const participations = await this.participantsRepository.find({
      where: { userId, leftAt: IsNull() },
      relations: {
        chat: {
          participants: { user: true },
        },
      },
    });

    let items = await Promise.all(
      participations
        .filter(
          (participation) =>
            !participation.chat.deletedAt &&
            participation.chat.type !== ChatType.EVENT,
        )
        .map((participation) =>
          this.toChatListItem(participation.chat, userId, participation),
        ),
    );

    if (query?.trim()) {
      const normalized = query.trim().toLowerCase();
      const normalizedDigits = normalized.replace(/\D/g, '');
      items = items.filter((item) => {
        if (item.title?.toLowerCase().includes(normalized)) {
          return true;
        }
        if (item.displayName.toLowerCase().includes(normalized)) {
          return true;
        }
        if (
          item.peerPhone &&
          (item.peerPhone.toLowerCase().includes(normalized) ||
            (normalizedDigits.length > 0 &&
              item.peerPhone.replace(/\D/g, '').includes(normalizedDigits)))
        ) {
          return true;
        }
        return item.participants.some((participant) => {
          if (participant.name.toLowerCase().includes(normalized)) {
            return true;
          }
          if (
            participant.phone &&
            (participant.phone.toLowerCase().includes(normalized) ||
              (normalizedDigits.length > 0 &&
                participant.phone
                  .replace(/\D/g, '')
                  .includes(normalizedDigits)))
          ) {
            return true;
          }
          return false;
        });
      });
    }

    return items.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      const aTime = a.lastMessage?.createdAt ?? a.updatedAt;
      const bTime = b.lastMessage?.createdAt ?? b.updatedAt;
      return bTime.getTime() - aTime.getTime();
    });
  }

  async pinChat(userId: string, chatId: string): Promise<ChatListItemDto> {
    const participation = await this.getActiveParticipation(chatId, userId);
    participation.pinnedAt = new Date();
    await this.participantsRepository.save(participation);

    const chat = await this.chatsRepository.findOne({
      where: { id: chatId },
      relations: { participants: { user: true } },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return this.toChatListItem(chat, userId, participation);
  }

  async unpinChat(userId: string, chatId: string): Promise<ChatListItemDto> {
    const participation = await this.getActiveParticipation(chatId, userId);
    participation.pinnedAt = null;
    await this.participantsRepository.save(participation);

    const chat = await this.chatsRepository.findOne({
      where: { id: chatId },
      relations: { participants: { user: true } },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return this.toChatListItem(chat, userId, participation);
  }

  async getDirectChatPeerIds(userId: string): Promise<string[]> {
    const participations = await this.participantsRepository.find({
      where: { userId, leftAt: IsNull() },
      relations: {
        chat: {
          participants: true,
        },
      },
    });

    const peerIds = new Set<string>();

    for (const participation of participations) {
      if (participation.chat.type !== ChatType.DIRECT) {
        continue;
      }

      const peer = participation.chat.participants.find(
        (item) => item.userId !== userId && !item.leftAt,
      );

      if (peer) {
        peerIds.add(peer.userId);
      }
    }

    return [...peerIds];
  }

  async getChatById(userId: string, chatId: string): Promise<ChatDetailDto> {
    const chat = await this.chatsRepository.findOne({
      where: { id: chatId },
      relations: {
        participants: { user: true },
      },
    });

    if (!chat || chat.deletedAt) {
      throw new NotFoundException('Chat not found');
    }

    const participation = await this.getActiveParticipation(chatId, userId);

    return this.toChatDetail(chat, userId, participation);
  }

  async updateGroupChat(
    userId: string,
    chatId: string,
    dto: UpdateGroupChatDto,
  ): Promise<ChatDetailDto> {
    const participation = await this.getActiveParticipation(chatId, userId);
    const chat = await this.getGroupChatOrFail(chatId);

    if (!this.isAdminOrOwner(chat, userId, participation)) {
      throw new ForbiddenException(
        'Only admins or owner can update group chat',
      );
    }

    if (dto.avatarMediaId) {
      await this.mediaService.assertOwnedUploadedMedia(
        dto.avatarMediaId,
        userId,
      );
    }

    Object.assign(chat, {
      title: dto.title ?? chat.title,
      description:
        dto.description !== undefined ? dto.description : chat.description,
      avatarMediaId:
        dto.avatarMediaId !== undefined
          ? dto.avatarMediaId
          : chat.avatarMediaId,
    });

    await this.chatsRepository.save(chat);
    const detail = await this.getChatById(userId, chatId);
    this.realtimeService.emitToChat(chatId, SocketEvents.CHAT_UPDATED, {
      chatId,
    });
    return detail;
  }

  async deleteGroupChat(
    userId: string,
    chatId: string,
  ): Promise<{ success: true }> {
    const chat = await this.getGroupChatOrFail(chatId);

    if (chat.ownerId !== userId) {
      throw new ForbiddenException('Only the group owner can delete the group');
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
        { chatId },
      );
    }

    return { success: true };
  }

  async addParticipant(
    actorId: string,
    chatId: string,
    targetUserId: string,
  ): Promise<ChatDetailDto> {
    const participation = await this.getActiveParticipation(chatId, actorId);
    const chat = await this.getGroupChatOrFail(chatId);

    if (!this.isAdminOrOwner(chat, actorId, participation)) {
      throw new ForbiddenException('Only admins or owner can add participants');
    }

    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.participantsRepository.findOne({
      where: { chatId, userId: targetUserId },
    });

    if (existing && !existing.leftAt) {
      throw new BadRequestException('User is already in the group');
    }

    let participant: ChatParticipant;
    if (existing) {
      existing.leftAt = null;
      existing.role = ChatParticipantRole.MEMBER;
      participant = await this.participantsRepository.save(existing);
    } else {
      participant = await this.participantsRepository.save(
        this.participantsRepository.create({
          chatId,
          userId: targetUserId,
          role: ChatParticipantRole.MEMBER,
        }),
      );
    }

    const participantDto = await this.mapParticipant(
      participant,
      chat,
      actorId,
    );
    this.realtimeService.emitToChat(
      chatId,
      SocketEvents.CHAT_PARTICIPANT_ADDED,
      { chatId, participant: participantDto },
    );
    this.realtimeService.emitToUser(targetUserId, SocketEvents.CHAT_UPDATED, {
      chatId,
    });

    return this.getChatById(actorId, chatId);
  }

  async removeParticipant(
    actorId: string,
    chatId: string,
    targetUserId: string,
  ): Promise<ChatDetailDto> {
    const participation = await this.getActiveParticipation(chatId, actorId);
    const chat = await this.getGroupChatOrFail(chatId);

    if (!this.isAdminOrOwner(chat, actorId, participation)) {
      throw new ForbiddenException(
        'Only admins or owner can remove participants',
      );
    }

    if (chat.ownerId === targetUserId) {
      throw new ForbiddenException('Owner cannot be removed from the group');
    }

    const target = await this.participantsRepository.findOne({
      where: { chatId, userId: targetUserId, leftAt: IsNull() },
    });

    if (!target) {
      throw new NotFoundException('Participant not found in this group');
    }

    target.leftAt = new Date();
    await this.participantsRepository.save(target);

    this.realtimeService.leaveChatRoom(targetUserId, chatId);

    this.realtimeService.emitToChat(
      chatId,
      SocketEvents.CHAT_PARTICIPANT_REMOVED,
      { chatId, userId: targetUserId },
    );
    this.realtimeService.emitToUser(targetUserId, SocketEvents.CHAT_UPDATED, {
      chatId,
    });

    return this.getChatById(actorId, chatId);
  }

  async updateParticipantRole(
    actorId: string,
    chatId: string,
    targetUserId: string,
    role: ChatParticipantRole,
  ): Promise<ChatDetailDto> {
    const chat = await this.getGroupChatOrFail(chatId);

    if (chat.ownerId !== actorId) {
      throw new ForbiddenException('Only owner can change participant roles');
    }

    if (chat.ownerId === targetUserId && role !== ChatParticipantRole.ADMIN) {
      throw new BadRequestException('Owner role is managed separately');
    }

    const target = await this.participantsRepository.findOne({
      where: { chatId, userId: targetUserId, leftAt: IsNull() },
    });

    if (!target) {
      throw new NotFoundException('Participant not found in this group');
    }

    target.role = role;
    await this.participantsRepository.save(target);

    this.realtimeService.emitToChat(chatId, SocketEvents.CHAT_UPDATED, {
      chatId,
    });

    return this.getChatById(actorId, chatId);
  }

  async leaveGroup(
    actorId: string,
    chatId: string,
  ): Promise<{ success: true }> {
    const chat = await this.getGroupChatOrFail(chatId);
    const participation = await this.getActiveParticipation(chatId, actorId);

    if (chat.ownerId === actorId) {
      await this.transferOwnership(chat, actorId);
    }

    participation.leftAt = new Date();
    await this.participantsRepository.save(participation);

    this.realtimeService.leaveChatRoom(actorId, chatId);

    this.realtimeService.emitToChat(
      chatId,
      SocketEvents.CHAT_PARTICIPANT_LEFT,
      {
        chatId,
        userId: actorId,
      },
    );
    this.realtimeService.emitToUser(actorId, SocketEvents.CHAT_UPDATED, {
      chatId,
    });

    return { success: true };
  }

  async getActiveChatIds(userId: string): Promise<string[]> {
    const participations = await this.participantsRepository.find({
      where: { userId, leftAt: IsNull() },
      select: { chatId: true },
    });

    return participations.map((participation) => participation.chatId);
  }

  async getActiveParticipation(
    chatId: string,
    userId: string,
  ): Promise<ChatParticipant> {
    const participation = await this.participantsRepository.findOne({
      where: { chatId, userId, leftAt: IsNull() },
    });

    if (!participation) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    return participation;
  }

  async getActiveParticipantUserIds(chatId: string): Promise<string[]> {
    const participants = await this.participantsRepository.find({
      where: { chatId, leftAt: IsNull() },
    });

    return participants.map((participant) => participant.userId);
  }

  async canDeleteMessage(
    userId: string,
    chatId: string,
    message: Message,
  ): Promise<boolean> {
    if (message.senderId === userId) {
      return true;
    }

    const chat = await this.chatsRepository.findOne({ where: { id: chatId } });
    if (
      !chat ||
      (chat.type !== ChatType.GROUP && chat.type !== ChatType.EVENT)
    ) {
      return false;
    }

    const participation = await this.getActiveParticipation(chatId, userId);
    return this.isAdminOrOwner(chat, userId, participation);
  }

  async touchChat(chatId: string): Promise<void> {
    await this.chatsRepository.update(chatId, { updatedAt: new Date() });
  }

  async getUnreadCount(
    chatId: string,
    userId: string,
    lastReadMessageId: string | null,
  ): Promise<number> {
    return this.chatsUnreadService.getUnreadCount(
      chatId,
      userId,
      lastReadMessageId,
    );
  }

  private async transferOwnership(
    chat: Chat,
    leavingOwnerId: string,
  ): Promise<void> {
    const activeParticipants = await this.participantsRepository.find({
      where: { chatId: chat.id, leftAt: IsNull() },
      order: { createdAt: 'ASC' },
    });

    const nextAdmin = activeParticipants.find(
      (participant) =>
        participant.userId !== leavingOwnerId &&
        participant.role === ChatParticipantRole.ADMIN,
    );

    const nextMember = activeParticipants.find(
      (participant) =>
        participant.userId !== leavingOwnerId &&
        participant.role === ChatParticipantRole.MEMBER,
    );

    const successor = nextAdmin ?? nextMember;
    if (!successor) {
      return;
    }

    chat.ownerId = successor.userId;
    await this.chatsRepository.save(chat);

    this.realtimeService.emitToChat(chat.id, SocketEvents.GROUP_OWNER_CHANGED, {
      chatId: chat.id,
      ownerId: successor.userId,
    });
  }

  private async getGroupChatOrFail(chatId: string): Promise<Chat> {
    const chat = await this.chatsRepository.findOne({ where: { id: chatId } });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.type !== ChatType.GROUP) {
      throw new BadRequestException(
        'This action is only available for group chats',
      );
    }

    if (chat.deletedAt) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  private isAdminOrOwner(
    chat: Chat,
    userId: string,
    participation: ChatParticipant,
  ): boolean {
    return (
      chat.ownerId === userId ||
      participation.role === ChatParticipantRole.ADMIN
    );
  }

  private async findExistingDirectChat(
    userId: string,
    otherUserId: string,
  ): Promise<Chat | null> {
    const chats = await this.chatsRepository
      .createQueryBuilder('chat')
      .innerJoin('chat.participants', 'participant')
      .where('chat.type = :type', { type: ChatType.DIRECT })
      .andWhere('participant.userId IN (:...userIds)', {
        userIds: [userId, otherUserId],
      })
      .andWhere('participant.leftAt IS NULL')
      .groupBy('chat.id')
      .having('COUNT(participant.id) = 2')
      .getMany();

    if (chats.length === 0) {
      return null;
    }

    return this.chatsRepository.findOne({
      where: { id: In(chats.map((chat) => chat.id)) },
      relations: { participants: { user: true } },
    });
  }

  private async toChatListItem(
    chat: Chat,
    userId: string,
    participation: ChatParticipant,
  ): Promise<ChatListItemDto> {
    const lastMessage = await this.getLastMessage(chat.id);
    const unreadCount = await this.getUnreadCount(
      chat.id,
      userId,
      participation.lastReadMessageId,
    );
    const peer = this.getDirectPeer(chat, userId);
    const isOnline = peer
      ? await this.presenceService.isOnline(peer.userId)
      : false;

    return {
      id: chat.id,
      type: chat.type,
      title: chat.title,
      description: chat.description,
      displayName: this.resolveDisplayName(chat, userId),
      avatarUrl: await this.resolveAvatarUrl(chat, userId),
      unreadCount,
      isPinned: participation.pinnedAt !== null,
      isOnline,
      peerUserId: peer?.userId ?? null,
      peerPhone: peer?.user?.phone ?? null,
      lastMessage,
      participants: await this.mapParticipants(chat.participants, chat, userId),
      updatedAt: chat.updatedAt,
    };
  }

  private getDirectPeer(
    chat: Chat,
    userId: string,
  ): ChatParticipant | undefined {
    if (chat.type !== ChatType.DIRECT) {
      return undefined;
    }

    return chat.participants.find(
      (participant) => participant.userId !== userId && !participant.leftAt,
    );
  }

  private async toChatDetail(
    chat: Chat,
    userId: string,
    participation?: ChatParticipant,
  ): Promise<ChatDetailDto> {
    const activeParticipation =
      participation ?? (await this.getActiveParticipation(chat.id, userId));

    return this.toChatListItem(chat, userId, activeParticipation);
  }

  private async getLastMessage(
    chatId: string,
  ): Promise<ChatLastMessageDto | null> {
    const message = await this.messagesRepository.findOne({
      where: { chatId },
      order: { createdAt: 'DESC' },
    });

    if (!message) {
      return null;
    }

    return {
      id: message.id,
      type: message.type,
      text: message.deletedAt ? '🚫 Message deleted' : message.text,
      senderId: message.senderId,
      createdAt: message.createdAt,
    };
  }

  private resolveDisplayName(chat: Chat, userId: string): string {
    if (chat.type === ChatType.GROUP || chat.type === ChatType.EVENT) {
      return chat.title ?? 'Group chat';
    }

    const otherParticipant = chat.participants.find(
      (participant) => participant.userId !== userId && !participant.leftAt,
    );

    return otherParticipant?.user?.name ?? 'Direct chat';
  }

  private async resolveAvatarUrl(
    chat: Chat,
    userId: string,
  ): Promise<string | null> {
    if (chat.type === ChatType.GROUP && chat.avatarMediaId) {
      try {
        return await this.mediaService.getDownloadUrlForUser(
          chat.avatarMediaId,
          userId,
        );
      } catch {
        return null;
      }
    }

    if (chat.type === ChatType.DIRECT) {
      const otherParticipant = chat.participants.find(
        (participant) => participant.userId !== userId && !participant.leftAt,
      );

      if (otherParticipant?.user?.avatarUrl) {
        return otherParticipant.user.avatarUrl;
      }

      if (otherParticipant?.user?.avatarMediaId) {
        try {
          return await this.mediaService.getDownloadUrlForUser(
            otherParticipant.user.avatarMediaId,
            userId,
          );
        } catch {
          return null;
        }
      }
    }

    return null;
  }

  private async mapParticipant(
    participant: ChatParticipant,
    chat: Chat,
    viewerId: string,
  ): Promise<ChatParticipantDto> {
    const user =
      participant.user ??
      (await this.usersService.findById(participant.userId));

    return {
      id: participant.id,
      userId: participant.userId,
      name: user?.name ?? 'Unknown',
      phone: user?.phone ?? null,
      avatarUrl:
        user?.avatarUrl ??
        (user?.avatarMediaId
          ? await this.getAvatarUrlForUser(user.avatarMediaId, chat, viewerId)
          : null),
      role: participant.role,
      isOwner: chat.ownerId === participant.userId,
    };
  }

  private async getAvatarUrlForUser(
    avatarMediaId: string,
    chat: Chat,
    viewerId: string,
  ): Promise<string | null> {
    try {
      return await this.mediaService.getDownloadUrlForUser(
        avatarMediaId,
        viewerId,
      );
    } catch {
      return null;
    }
  }

  private async mapParticipants(
    participants: ChatParticipant[],
    chat: Chat,
    viewerId: string,
  ): Promise<ChatParticipantDto[]> {
    const active = participants.filter((participant) => !participant.leftAt);

    return Promise.all(
      active.map((participant) =>
        this.mapParticipant(participant, chat, viewerId),
      ),
    );
  }
}
