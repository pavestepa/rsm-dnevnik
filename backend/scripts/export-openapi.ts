import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('RSM Dnevnik API')
    .setDescription('Messenger backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outputDir = resolve(__dirname, '../openapi');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    resolve(outputDir, 'openapi.json'),
    JSON.stringify(document, null, 2),
  );

  await app.close();
  console.log('OpenAPI spec exported to backend/openapi/openapi.json');
}

void exportOpenApi();
