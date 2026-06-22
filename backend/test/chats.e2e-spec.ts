import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getHttpServer, login } from './test-utils';

describe('Chats (e2e)', () => {
  let app: INestApplication;
  let aliceToken: string;
  let bobToken: string;
  let directChatId: string;
  let groupChatId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    aliceToken = await login(app, 'alice', 'password123');
    bobToken = await login(app, 'bob', 'password123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a direct chat', async () => {
    const response = await request(getHttpServer(app))
      .post('/chats/direct')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ participantId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
      .expect(201);

    directChatId = (response.body as { id: string }).id;
    expect(directChatId).toBeDefined();
  });

  it('lists chats with unread badge', async () => {
    await request(getHttpServer(app))
      .post(`/chats/${directChatId}/messages`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ type: 'text', text: 'unread ping' })
      .expect(201);

    await request(getHttpServer(app))
      .get('/chats')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as Array<{ id: string; unreadCount: number }>;
        const chat = body.find((item) => item.id === directChatId);
        expect(chat?.unreadCount).toBeGreaterThan(0);
      });
  });

  it('pins and unpins a chat', async () => {
    await request(getHttpServer(app))
      .post(`/chats/${directChatId}/pin`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(201)
      .expect((res) => {
        const body = res.body as { isPinned: boolean };
        expect(body.isPinned).toBe(true);
      });

    await request(getHttpServer(app))
      .post(`/chats/${directChatId}/unpin`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(201)
      .expect((res) => {
        const body = res.body as { isPinned: boolean };
        expect(body.isPinned).toBe(false);
      });
  });

  it('marks chat as read and clears unread', async () => {
    await request(getHttpServer(app))
      .post(`/chats/${directChatId}/read`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({})
      .expect(201)
      .expect((res) => {
        const body = res.body as { unreadCount: number };
        expect(body.unreadCount).toBe(0);
      });
  });

  it('creates a group chat with participants', async () => {
    const response = await request(getHttpServer(app))
      .post('/chats/group')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'Test Group',
        participantIds: ['b2c3d4e5-f6a7-8901-bcde-f12345678901'],
      })
      .expect(201);

    groupChatId = (response.body as { id: string }).id;
    expect(groupChatId).toBeDefined();
  });

  it('rejects self direct chat', async () => {
    await request(getHttpServer(app))
      .post('/chats/direct')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ participantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
      .expect(400);
  });
});
