import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MessageType, MessageDeliveryStatus } from '../../../common/enums';

export class CreateMessageDto {
  @IsEnum(MessageType)
  type: MessageType;

  @ValidateIf((dto: CreateMessageDto) => dto.type === MessageType.TEXT)
  @IsString()
  @MaxLength(4096)
  text?: string;

  @ValidateIf((dto: CreateMessageDto) =>
    [MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO].includes(
      dto.type,
    ),
  )
  @IsUUID()
  mediaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  caption?: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

export class UpdateMessageDto {
  @IsString()
  @MaxLength(4096)
  text: string;
}

import { CursorPaginationDto } from '../../../common/dto/pagination.dto';

export class SearchMessagesQueryDto extends CursorPaginationDto {
  @IsString()
  @MaxLength(256)
  q: string;
}

export class MarkChatReadDto {
  @IsOptional()
  @IsUUID()
  messageId?: string;
}

export class MessageSenderDto {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export class MessageMediaDto {
  id: string;
  mimeType: string;
  size: number;
  url: string | null;
  durationSeconds: number | null;
}

export class MessageResponseDto {
  id: string;
  chatId: string;
  type: MessageType;
  text: string | null;
  media: MessageMediaDto | null;
  sender: MessageSenderDto;
  replyToId: string | null;
  createdAt: Date;
  editedAt: Date | null;
  status: MessageDeliveryStatus | null;
  isDeleted: boolean;
  deletedForEveryone: boolean;
}
