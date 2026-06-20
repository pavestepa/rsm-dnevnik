import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  displayName?: string;
}

export class SyncContactItemDto {
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  displayName?: string;
}

export class SyncContactsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SyncContactItemDto)
  contacts: SyncContactItemDto[];
}

export class ContactResponseDto {
  id: string;
  phone: string;
  displayName: string;
  matchedUserId: string | null;
  matchedUserName: string | null;
  matchedUserAvatarUrl: string | null;
  isRegistered: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}
