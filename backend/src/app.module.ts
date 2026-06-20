import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './modules/users/users.module';
import { MediaModule } from './modules/media/media.module';
import { ChatsModule } from './modules/chats/chats.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AuthModule } from './modules/auth/auth.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { PushModule } from './modules/push/push.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          transport:
            configService.get<string>('nodeEnv') !== 'production'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          genReqId: (req) =>
            (req.headers['x-request-id'] as string | undefined) ??
            randomUUID(),
          customProps: (req) => ({
            requestId: req.headers['x-request-id'],
          }),
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'default',
          ttl: 60_000,
          limit: 1000,
        },
        {
          name: 'auth',
          ttl: configService.get<number>('throttle.authTtl') ?? 60_000,
          limit: configService.get<number>('throttle.authLimit') ?? 10,
        },
      ],
    }),
    RedisModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MediaModule,
    ChatsModule,
    MessagesModule,
    ContactsModule,
    RealtimeModule,
    PushModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
