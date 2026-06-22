import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, ForbiddenException, UsePipes } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import type { Namespace } from 'socket.io';
import { WsAuthService } from './ws-auth.service';
import { PresenceService } from './presence.service';
import { TypingService } from './typing.service';
import { RealtimeService } from './realtime.service';
import { ChatsService } from '../chats/chats.service';
import { MessageReceiptService } from '../messages/message-receipt.service';
import { MessagesService } from '../messages/messages.service';
import { chatRoom, SocketEvents, userRoom } from './socket-events';
import { ChatJoinDto, MessageDeliveredDto, TypingDto } from './dto/ws.dto';
import { getWebSocketCorsOptions } from '../../config/cors.util';
import { WsValidationPipe } from '../../common/pipes/ws-validation.pipe';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
  };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: getWebSocketCorsOptions(),
})
@UsePipes(new WsValidationPipe())
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly wsAuthService: WsAuthService,
    private readonly presenceService: PresenceService,
    private readonly typingService: TypingService,
    private readonly realtimeService: RealtimeService,
    private readonly chatsService: ChatsService,
    private readonly messageReceiptService: MessageReceiptService,
    private readonly messagesService: MessagesService,
  ) {}

  afterInit(server: Server): void {
    this.realtimeService.setServer(server);

    const ioServer = (server as unknown as Namespace).server;
    const pubClient = new Redis({
      host: this.configService.get<string>('redis.host') ?? 'localhost',
      port: this.configService.get<number>('redis.port') ?? 6379,
      password: this.configService.get<string>('redis.password') || undefined,
      maxRetriesPerRequest: null,
    });
    const subClient = pubClient.duplicate();
    ioServer.adapter(createAdapter(pubClient, subClient));
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        client.handshake.headers.authorization?.replace('Bearer ', '');

      const payload = await this.wsAuthService.verifyToken(token ?? '');
      client.data.userId = payload.sub;

      await this.presenceService.add(payload.sub, client.id);
      await client.join(userRoom(payload.sub));

      const chatIds = await this.chatsService.getActiveChatIds(payload.sub);
      for (const chatId of chatIds) {
        await client.join(chatRoom(chatId));
      }

      const peerIds = await this.chatsService.getDirectChatPeerIds(payload.sub);
      for (const peerId of peerIds) {
        this.realtimeService.emitToUser(peerId, SocketEvents.PRESENCE_UPDATE, {
          userId: payload.sub,
          isOnline: true,
        });
      }

      this.logger.log(`Client connected: user=${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const userId = client.data?.userId;
    if (userId) {
      await this.presenceService.remove(userId, client.id);
      const stillOnline = await this.presenceService.isOnline(userId);
      if (!stillOnline) {
        const peerIds = await this.chatsService.getDirectChatPeerIds(userId);
        for (const peerId of peerIds) {
          this.realtimeService.emitToUser(
            peerId,
            SocketEvents.PRESENCE_UPDATE,
            {
              userId,
              isOnline: false,
            },
          );
        }
      }
      this.logger.log(`Client disconnected: user=${userId}`);
    }
  }

  @SubscribeMessage(SocketEvents.CHAT_JOIN)
  async handleChatJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: ChatJoinDto,
  ): Promise<{ success: boolean }> {
    await this.chatsService.getActiveParticipation(
      dto.chatId,
      client.data.userId,
    );
    await client.join(chatRoom(dto.chatId));
    return { success: true };
  }

  @SubscribeMessage(SocketEvents.CHAT_LEAVE)
  async handleChatLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: ChatJoinDto,
  ): Promise<{ success: boolean }> {
    await client.leave(chatRoom(dto.chatId));
    return { success: true };
  }

  @SubscribeMessage(SocketEvents.MESSAGE_DELIVERED)
  async handleMessageDelivered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: MessageDeliveredDto,
  ): Promise<{ success: boolean }> {
    try {
      await this.messageReceiptService.markDelivered(
        dto.messageId,
        client.data.userId,
      );
      await this.messagesService.notifyStatusUpdate(dto.messageId);
      return { success: true };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof WsException) {
        return { success: false };
      }
      throw error;
    }
  }

  @SubscribeMessage(SocketEvents.TYPING_START)
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: TypingDto,
  ): Promise<{ success: boolean }> {
    await this.chatsService.getActiveParticipation(
      dto.chatId,
      client.data.userId,
    );
    await this.typingService.startTyping(dto.chatId, client.data.userId);
    this.realtimeService.emitToChat(dto.chatId, SocketEvents.TYPING_UPDATE, {
      chatId: dto.chatId,
      userId: client.data.userId,
      isTyping: true,
    });
    return { success: true };
  }

  @SubscribeMessage(SocketEvents.TYPING_STOP)
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: TypingDto,
  ): Promise<{ success: boolean }> {
    await this.typingService.stopTyping(dto.chatId, client.data.userId);
    this.realtimeService.emitToChat(dto.chatId, SocketEvents.TYPING_UPDATE, {
      chatId: dto.chatId,
      userId: client.data.userId,
      isTyping: false,
    });
    return { success: true };
  }
}
