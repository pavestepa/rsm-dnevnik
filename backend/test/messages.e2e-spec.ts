import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getHttpServer, login } from './test-utils';

describe('Messages (e2e)', () => {
  let app: INestApplication;
  let aliceToken: string;
  let chatId: string;
  let messageId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    aliceToken = await login(app, 'alice', 'password123');

    const chatResponse = await request(getHttpServer(app))
      .post('/chats/direct')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ participantId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
      .expect(201);

    chatId = (chatResponse.body as { id: string }).id;

    const messageResponse = await request(getHttpServer(app))
      .post(`/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ type: 'text', text: 'hello searchable world' })
      .expect(201);

    messageId = (messageResponse.body as { id: string }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('edits a text message', async () => {
    await request(getHttpServer(app))
      .patch(`/chats/${chatId}/messages/${messageId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ text: 'hello edited world' })
      .expect(200)
      .expect((res) => {
        const body = res.body as { text: string; editedAt: string | null };
        expect(body.text).toBe('hello edited world');
        expect(body.editedAt).toBeDefined();
      });
  });

  it('searches messages by text', async () => {
    await request(getHttpServer(app))
      .get(`/chats/${chatId}/messages/search`)
      .query({ q: 'edited' })
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as { items: unknown[] };
        expect(body.items.length).toBeGreaterThan(0);
      });
  });

  it('deletes a message', async () => {
    await request(getHttpServer(app))
      .delete(`/chats/${chatId}/messages/${messageId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as { success: boolean };
        expect(body.success).toBe(true);
      });
  });

  it('marks chat read and updates unread count', async () => {
    const bobToken = await login(app, 'bob', 'password123');

    const newMessage = await request(getHttpServer(app))
      .post(`/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ type: 'text', text: 'read receipt test' })
      .expect(201);

    const newMessageId = (newMessage.body as { id: string }).id;

    await request(getHttpServer(app))
      .post(`/chats/${chatId}/read`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ messageId: newMessageId })
      .expect(201)
      .expect((res) => {
        const body = res.body as { unreadCount: number };
        expect(body.unreadCount).toBe(0);
      });
  });
});
