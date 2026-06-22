import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getHttpServer } from './test-utils';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(getHttpServer(app))
      .get('/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as { status: string };
        expect(body.status).toBe('ok');
      });
  });
});
