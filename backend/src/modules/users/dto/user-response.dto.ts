import { MediaStatus, MediaKind } from '../../../common/enums';

export class UserResponseDto {
  id: string;
  name: string;
  phone: string | null;
  bio: string | null;
  avatarMediaId: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class MediaSummaryDto {
  id: string;
  kind: MediaKind;
  mimeType: string;
  size: number;
  status: MediaStatus;
  url: string | null;
  durationSeconds: number | null;
}
