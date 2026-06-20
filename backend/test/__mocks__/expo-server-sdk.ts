export class Expo {
  constructor(_options?: { accessToken?: string }) {}

  static isExpoPushToken(token: string): boolean {
    return token.startsWith('ExponentPushToken[');
  }

  chunkPushNotifications<T>(messages: T[]): T[][] {
    return [messages];
  }

  async sendPushNotificationsAsync(): Promise<
    Array<{ status: 'ok' } | { status: 'error'; details?: { error?: string } }>
  > {
    return [];
  }
}

export type ExpoPushMessage = Record<string, unknown>;
export type ExpoPushTicket = {
  status: string;
  details?: { error?: string };
};
