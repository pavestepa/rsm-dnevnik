import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { createTestApp, getAppPort, login } from './test-utils';

describe('WebSocket validation (e2e)', () => {
  let app: INestApplication;
  let socket: Socket;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    const port = getAppPort(app);
    const token = await login(app, 'alice', 'password123');

    socket = await new Promise<Socket>((resolve, reject) => {
      const client = io(`http://127.0.0.1:${port}/chat`, {
        auth: { token },
        transports: ['websocket'],
        forceNew: true,
      });
      client.on('connect', () => resolve(client));
      client.on('connect_error', reject);
      setTimeout(() => reject(new Error('WS connect timeout')), 5000);
    });
  });

  afterAll(async () => {
    socket?.disconnect();
    await app.close();
  });

  it('rejects invalid message:delivered payload', async () => {
    await new Promise<void>((resolve, reject) => {
      socket
        .timeout(3000)
        .emit(
          'message:delivered',
          { messageId: 'not-a-uuid' },
          (err: Error | null, result: { success: boolean } | undefined) => {
            if (err) {
              resolve();
              return;
            }

            if (result && result.success === false) {
              resolve();
              return;
            }

            reject(new Error('Expected WS validation failure'));
          },
        );
    });
  });
});
