import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication({ bufferLogs: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();
  return app;
}

export async function login(
  app: INestApplication,
  loginName: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ login: loginName, password });

  if (response.status !== 201 && response.status !== 200) {
    throw new Error(
      `Login failed: ${response.status} ${JSON.stringify(response.body)}`,
    );
  }

  return response.body.accessToken as string;
}

export function getAppPort(app: INestApplication): number {
  const address = app.getHttpServer().address();
  if (typeof address === 'object' && address) {
    return address.port;
  }
  throw new Error('Unable to resolve app port');
}
