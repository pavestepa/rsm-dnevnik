import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getHttpServer, login } from './test-utils';

describe('Contacts (e2e)', () => {
  let app: INestApplication;
  let aliceToken: string;
  let contactId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    aliceToken = await login(app, 'alice', 'password123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a contact by phone', async () => {
    const response = await request(getHttpServer(app))
      .post('/contacts')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ phone: '+79003333333', displayName: 'Charlie' })
      .expect(201);

    contactId = (response.body as { id: string }).id;
    expect(contactId).toBeDefined();
  });

  it('rejects duplicate contact phone', async () => {
    await request(getHttpServer(app))
      .post('/contacts')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ phone: '+79003333333', displayName: 'Charlie duplicate' })
      .expect(409);
  });

  it('rejects adding yourself as contact', async () => {
    await request(getHttpServer(app))
      .post('/contacts')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ phone: '+79001111111', displayName: 'Self' })
      .expect(400);
  });

  it('lists and searches contacts', async () => {
    await request(getHttpServer(app))
      .get('/contacts')
      .query({ q: 'Charlie' })
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as unknown[];
        expect(body.length).toBeGreaterThan(0);
      });
  });

  it('syncs contacts from device', async () => {
    await request(getHttpServer(app))
      .post('/contacts/sync')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        contacts: [{ phone: '+79004444444', displayName: 'Synced User' }],
      })
      .expect(201);
  });

  it('deletes a contact', async () => {
    await request(getHttpServer(app))
      .delete(`/contacts/${contactId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);
  });
});
