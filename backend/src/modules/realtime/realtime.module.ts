import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { WsAuthService } from './ws-auth.service';
import { PresenceService } from './presence.service';
import { TypingService } from './typing.service';
import { RealtimeService } from './realtime.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ChatsModule } from '../chats/chats.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.accessTokenSecret'),
      }),
    }),
    AuthModule,
    UsersModule,
    forwardRef(() => ChatsModule),
    forwardRef(() => MessagesModule),
  ],
  providers: [
    ChatGateway,
    WsAuthService,
    PresenceService,
    TypingService,
    RealtimeService,
  ],
  exports: [RealtimeService, PresenceService],
})
export class RealtimeModule {}
