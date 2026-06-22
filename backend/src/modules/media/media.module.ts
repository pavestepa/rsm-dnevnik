import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { S3Service } from './s3.service';
import { Message } from '../messages/entities/message.entity';
import { ChatParticipant } from '../chats/entities/chat-participant.entity';
import { Chat } from '../chats/entities/chat.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media, Message, ChatParticipant, Chat, User]),
  ],
  controllers: [MediaController],
  providers: [MediaService, S3Service],
  exports: [MediaService, S3Service],
})
export class MediaModule {}
