import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getCorsOrigin, UNSAFE_JWT_SECRETS } from './config/cors.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('nodeEnv') ?? 'development';

  if (nodeEnv === 'production') {
    const secret = configService.get<string>('auth.accessTokenSecret');
    if (!secret || UNSAFE_JWT_SECRETS.includes(secret) || secret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be set in production');
    }
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: getCorsOrigin(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (configService.get<boolean>('swagger.enabled')) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('RSM Dnevnik API')
      .setDescription('Messenger backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('port') ?? 3000;

  await app.listen(port);
}
void bootstrap();
