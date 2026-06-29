import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getHttpServer, login } from './test-utils';

describe('Events (e2e)', () => {
  let app: INestApplication;
  let aliceToken: string;
  let bobToken: string;
  let groupChatId: string;
  let eventId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    aliceToken = await login(app, 'alice', 'password123');
    bobToken = await login(app, 'bob', 'password123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a group for events', async () => {
    const response = await request(getHttpServer(app))
      .post('/chats/group')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'Diary Group',
        participantIds: ['b2c3d4e5-f6a7-8901-bcde-f12345678901'],
      })
      .expect(201);

    groupChatId = (response.body as { id: string }).id;
    expect(groupChatId).toBeDefined();
  });

  it('creates an event linked to the group', async () => {
    const response = await request(getHttpServer(app))
      .post('/events')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        groupChatId,
        title: 'Planning session',
        body: 'Discuss roadmap for the diary feature.',
      })
      .expect(201);

    const body = response.body as {
      id: string;
      title: string;
      chatId: string;
      canEdit: boolean;
    };

    eventId = body.id;
    expect(body.title).toBe('Planning session');
    expect(body.chatId).toBeDefined();
    expect(body.canEdit).toBe(true);
  });

  it('does not list event chat in general chats', async () => {
    const eventResponse = await request(getHttpServer(app))
      .get(`/events/${eventId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    const eventChatId = (eventResponse.body as { chatId: string }).chatId;

    await request(getHttpServer(app))
      .get('/chats')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200)
      .expect((res) => {
        const chats = res.body as Array<{ id: string }>;
        expect(chats.some((chat) => chat.id === eventChatId)).toBe(false);
        expect(chats.some((chat) => chat.id === groupChatId)).toBe(true);
      });
  });

  it('lists events for group members', async () => {
    await request(getHttpServer(app))
      .get('/events')
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as { items: Array<{ id: string }> };
        expect(body.items.some((item) => item.id === eventId)).toBe(true);
      });
  });

  it('returns event detail', async () => {
    await request(getHttpServer(app))
      .get(`/events/${eventId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as { body: string; canDelete: boolean };
        expect(body.body).toContain('roadmap');
        expect(body.canDelete).toBe(true);
      });
  });

  it('updates event as creator', async () => {
    await request(getHttpServer(app))
      .patch(`/events/${eventId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ title: 'Updated planning session' })
      .expect(200)
      .expect((res) => {
        const body = res.body as { title: string };
        expect(body.title).toBe('Updated planning session');
      });
  });

  it('forbids edit from non-creator member', async () => {
    await request(getHttpServer(app))
      .patch(`/events/${eventId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ title: 'Hacked title' })
      .expect(403);
  });

  it('deletes event as creator', async () => {
    await request(getHttpServer(app))
      .delete(`/events/${eventId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as { success: boolean };
        expect(body.success).toBe(true);
      });

    await request(getHttpServer(app))
      .get(`/events/${eventId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(404);
  });
});
