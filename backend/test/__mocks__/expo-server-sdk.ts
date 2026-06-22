export class Expo {
  constructor(_options?: { accessToken?: string }) {
    void _options;
  }

  static isExpoPushToken(token: string): boolean {
    return token.startsWith('ExponentPushToken[');
  }

  chunkPushNotifications<T>(messages: T[]): T[][] {
    return [messages];
  }

  sendPushNotificationsAsync(): Promise<
    Array<{ status: 'ok' } | { status: 'error'; details?: { error?: string } }>
  > {
    return Promise.resolve([]);
  }
}

export type ExpoPushMessage = Record<string, unknown>;
export type ExpoPushTicket = {
  status: string;
  details?: { error?: string };
};
