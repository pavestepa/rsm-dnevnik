import { MediaKind } from '../../../common/enums';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PresignUploadDto {
  @IsEnum(MediaKind)
  kind: MediaKind;

  @IsString()
  @MaxLength(128)
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(524_288_000)
  size: number;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  fileName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;
}

export class PresignUploadResponseDto {
  mediaId: string;
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}

export class MediaResponseDto {
  id: string;
  kind: MediaKind;
  mimeType: string;
  size: number;
  status: string;
  downloadUrl: string | null;
  durationSeconds: number | null;
  createdAt: Date;
}
