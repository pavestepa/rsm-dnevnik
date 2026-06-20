import { IsUUID } from 'class-validator';

export class ChatJoinDto {
  @IsUUID()
  chatId: string;
}

export class MessageDeliveredDto {
  @IsUUID()
  messageId: string;
}

export class TypingDto {
  @IsUUID()
  chatId: string;
}
