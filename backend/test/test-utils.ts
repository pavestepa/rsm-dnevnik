import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Server } from 'node:http';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

type LoginResponse = {
  accessToken: string;
};

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

export function getHttpServer(app: INestApplication): App {
  return app.getHttpServer() as App;
}

export async function login(
  app: INestApplication,
  loginName: string,
  password: string,
): Promise<string> {
  const response = await request(getHttpServer(app))
    .post('/auth/login')
    .send({ login: loginName, password });

  if (response.status !== 201 && response.status !== 200) {
    throw new Error(
      `Login failed: ${response.status} ${JSON.stringify(response.body)}`,
    );
  }

  const body = response.body as LoginResponse;
  return body.accessToken;
}

export function getAppPort(app: INestApplication): number {
  const server = app.getHttpServer() as Server;
  const address = server.address();
  if (typeof address === 'object' && address !== null) {
    return address.port;
  }
  throw new Error('Unable to resolve app port');
}
