import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, login } from './test-utils';

describe('Push (e2e)', () => {
  let app: INestApplication<App>;
  let aliceToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    aliceToken = await login(app, 'alice', 'password123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers expo push token', async () => {
    await request(app.getHttpServer())
      .post('/push/register')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        expoPushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
        platform: 'ios',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });
  });
});
