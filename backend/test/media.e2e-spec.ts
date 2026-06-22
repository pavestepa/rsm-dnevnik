import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { createTestApp, getHttpServer, login } from './test-utils';
import { Media } from '../src/modules/media/entities/media.entity';
import { MediaKind, MediaStatus } from '../src/common/enums';

describe('Media ACL (e2e)', () => {
  let app: INestApplication;
  let mediaRepository: Repository<Media>;
  const aliceId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    mediaRepository = app.get(getRepositoryToken(Media));
  });

  afterAll(async () => {
    await app.close();
  });

  it('denies media access to unrelated user', async () => {
    const media = await mediaRepository.save(
      mediaRepository.create({
        objectKey: `image/${aliceId}/${randomUUID()}.png`,
        bucket: 'rsm-dnevnik',
        kind: MediaKind.IMAGE,
        mimeType: 'image/png',
        size: 100,
        status: MediaStatus.UPLOADED,
        uploadedById: aliceId,
        durationSeconds: null,
      }),
    );

    const bobToken = await login(app, 'bob', 'password123');

    await request(getHttpServer(app))
      .get(`/media/${media.id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(403);
  });
});
