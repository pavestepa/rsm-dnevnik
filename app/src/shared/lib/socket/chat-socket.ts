import { env } from '@/shared/config/env';
import { io, type Socket } from 'socket.io-client';

let sharedSocket: Socket | null = null;

export function getChatSocket(accessToken: string): Socket {
  if (sharedSocket) {
    sharedSocket.auth = { token: accessToken };

    if (!sharedSocket.connected) {
      sharedSocket.connect();
    }

    return sharedSocket;
  }

  sharedSocket = io(`${env.wsUrl}/chat`, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: true,
  });

  return sharedSocket;
}

export function disconnectChatSocket(): void {
  sharedSocket?.disconnect();
  sharedSocket = null;
}

export function getSharedChatSocket(): Socket | null {
  return sharedSocket;
}

export async function joinChatRoom(chatId: string): Promise<boolean> {
  const socket = sharedSocket;
  if (!socket?.connected) {
    return false;
  }

  return new Promise((resolve) => {
    socket.emit('chat:join', { chatId }, (response: { success?: boolean }) => {
      resolve(response?.success ?? false);
    });
  });
}

export async function leaveChatRoom(chatId: string): Promise<void> {
  const socket = sharedSocket;
  if (!socket?.connected) {
    return;
  }

  return new Promise((resolve) => {
    socket.emit('chat:leave', { chatId }, () => resolve());
  });
}

export function emitMessageDelivered(messageId: string): void {
  sharedSocket?.emit('message:delivered', { messageId });
}

export function emitTypingStart(chatId: string): void {
  sharedSocket?.emit('typing:start', { chatId });
}

export function emitTypingStop(chatId: string): void {
  sharedSocket?.emit('typing:stop', { chatId });
}
