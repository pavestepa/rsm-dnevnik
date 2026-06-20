import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { chatRoom, userRoom } from './socket-events';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  setServer(server: Server): void {
    this.server = server;
  }

  emitToChat(chatId: string, event: string, data: unknown): void {
    this.server?.to(chatRoom(chatId)).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.server?.to(userRoom(userId)).emit(event, data);
  }

  async leaveChatRoom(userId: string, chatId: string): Promise<void> {
    await this.server?.in(userRoom(userId)).socketsLeave(chatRoom(chatId));
  }

  getOnlineUserIdsInChat(
    chatId: string,
    userIds: string[],
    presence: { isOnline: (id: string) => boolean },
  ): string[] {
    return userIds.filter((userId) => presence.isOnline(userId));
  }
}
