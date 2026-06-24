import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessageReceipt } from './entities/message-receipt.entity';
import { MessageUserDeletion } from './entities/message-user-deletion.entity';
import { ChatParticipant } from '../chats/entities/chat-participant.entity';
import { MessagesService } from './messages.service';
import { MessageReceiptService } from './message-receipt.service';
import { MessagesController } from './messages.controller';
import { ChatsModule } from '../chats/chats.module';
import { MediaModule } from '../media/media.module';
import { UsersModule } from '../users/users.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      MessageReceipt,
      MessageUserDeletion,
      ChatParticipant,
    ]),
    forwardRef(() => ChatsModule),
    forwardRef(() => MediaModule),
    forwardRef(() => RealtimeModule),
    PushModule,
    UsersModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessageReceiptService],
  exports: [MessagesService, MessageReceiptService],
})
export class MessagesModule {}
