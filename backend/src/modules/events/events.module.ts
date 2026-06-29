import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { EventMedia } from './entities/event-media.entity';
import { Chat } from '../chats/entities/chat.entity';
import { ChatParticipant } from '../chats/entities/chat-participant.entity';
import { Message } from '../messages/entities/message.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { ChatsModule } from '../chats/chats.module';
import { MediaModule } from '../media/media.module';
import { UsersModule } from '../users/users.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventMedia,
      Chat,
      ChatParticipant,
      Message,
    ]),
    ChatsModule,
    forwardRef(() => MediaModule),
    UsersModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
