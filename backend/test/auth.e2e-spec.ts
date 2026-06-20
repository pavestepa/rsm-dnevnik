import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './test-utils';

describe('Auth (e2e)', () => {
  describe('login', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp();
      await app.listen(0);
    });

    afterAll(async () => {
      await app.close();
    });

    it('logs in seeded user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ login: 'alice', password: 'password123' })
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user.name).toBe('alice');
        });
    });
  });

  describe('rate limit', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp();
      await app.listen(0);
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 429 after too many login attempts', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ login: 'alice', password: 'wrong-password' })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: 'alice', password: 'wrong-password' })
      .expect(429);
    });
  });
});
