import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, login } from './test-utils';

describe('Messages (e2e)', () => {
  let app: INestApplication<App>;
  let aliceToken: string;
  let chatId: string;
  let messageId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    aliceToken = await login(app, 'alice', 'password123');

    const chatResponse = await request(app.getHttpServer())
      .post('/chats/direct')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ participantId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
      .expect(201);

    chatId = chatResponse.body.id;

    const messageResponse = await request(app.getHttpServer())
      .post(`/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ type: 'text', text: 'hello searchable world' })
      .expect(201);

    messageId = messageResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('edits a text message', async () => {
    await request(app.getHttpServer())
      .patch(`/chats/${chatId}/messages/${messageId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ text: 'hello edited world' })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe('hello edited world');
        expect(res.body.editedAt).toBeDefined();
      });
  });

  it('searches messages by text', async () => {
    await request(app.getHttpServer())
      .get(`/chats/${chatId}/messages/search`)
      .query({ q: 'edited' })
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.items.length).toBeGreaterThan(0);
      });
  });

  it('deletes a message', async () => {
    await request(app.getHttpServer())
      .delete(`/chats/${chatId}/messages/${messageId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });
  });
});
