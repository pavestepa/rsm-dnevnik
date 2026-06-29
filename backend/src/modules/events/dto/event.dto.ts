import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EventMediaInputDto {
  @IsUUID()
  mediaId: string;

  @IsString()
  kind: 'image' | 'file';

  @IsOptional()
  @IsString()
  @MaxLength(256)
  fileName?: string;
}

export class CreateEventDto {
  @IsUUID()
  groupChatId: string;

  @IsString()
  @MaxLength(256)
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EventMediaInputDto)
  media?: EventMediaInputDto[];
}

export class UpdateEventDto {
  @IsOptional()
  @IsUUID()
  groupChatId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EventMediaInputDto)
  media?: EventMediaInputDto[];
}

export class EventAuthorDto {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export class EventGroupDto {
  id: string;
  title: string;
  avatarUrl: string | null;
}

export class EventImageDto {
  id: string;
  url: string;
}

export class EventFileDto {
  id: string;
  fileName: string;
  mimeType: string;
  downloadUrl: string | null;
}

export class EventChatPreviewDto {
  lastMessage: {
    text: string | null;
    createdAt: Date;
  } | null;
  writerAvatars: EventAuthorDto[];
}

export class EventListItemDto {
  id: string;
  title: string;
  bodyPreview: string;
  createdAt: Date;
  updatedAt: Date;
  author: EventAuthorDto;
  group: EventGroupDto;
  images: EventImageDto[];
  totalImages: number;
  filesCount: number;
  chatId: string;
  chatPreview: EventChatPreviewDto;
  canEdit: boolean;
  canDelete: boolean;
}

export class EventDetailDto extends EventListItemDto {
  body: string;
  files: EventFileDto[];
}
