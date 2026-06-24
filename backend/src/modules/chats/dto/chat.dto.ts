import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateDirectChatDto {
  @IsUUID()
  participantId: string;
}

export class CreateGroupChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  title: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  participantIds: string[];

  @IsOptional()
  @IsUUID()
  avatarMediaId?: string;
}

export class UpdateGroupChatDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  title?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(512)
  description?: string | null;

  @IsOptional()
  @IsUUID()
  avatarMediaId?: string | null;
}

export class ChatParticipantDto {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  isOwner: boolean;
}

export class ChatLastMessageDto {
  id: string;
  type: string;
  text: string | null;
  senderId: string;
  createdAt: Date;
}

export class ChatListItemDto {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  displayName: string;
  avatarUrl: string | null;
  unreadCount: number;
  isPinned: boolean;
  isOnline: boolean;
  peerUserId: string | null;
  peerPhone: string | null;
  lastMessage: ChatLastMessageDto | null;
  participants: ChatParticipantDto[];
  updatedAt: Date;
}

export class ChatDetailDto extends ChatListItemDto {}
