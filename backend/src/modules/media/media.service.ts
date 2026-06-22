import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { S3Service } from './s3.service';
import {
  MediaResponseDto,
  PresignUploadDto,
  PresignUploadResponseDto,
} from './dto/media.dto';
import { MediaKind, MediaStatus } from '../../common/enums';
import { Message } from '../messages/entities/message.entity';
import { ChatParticipant } from '../chats/entities/chat-participant.entity';
import { Chat } from '../chats/entities/chat.entity';
import { User } from '../users/entities/user.entity';

const ALLOWED_MIME_TYPES: Record<MediaKind, string[]> = {
  [MediaKind.IMAGE]: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  [MediaKind.VIDEO]: ['video/mp4', 'video/quicktime', 'video/webm'],
  [MediaKind.AUDIO]: [
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
  ],
  [MediaKind.AVATAR]: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ],
};

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(ChatParticipant)
    private readonly participantsRepository: Repository<ChatParticipant>,
    @InjectRepository(Chat)
    private readonly chatsRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly s3Service: S3Service,
  ) {}

  async createPresignedUpload(
    userId: string,
    dto: PresignUploadDto,
  ): Promise<PresignUploadResponseDto> {
    this.assertMimeType(dto.kind, dto.mimeType);

    const objectKey = this.s3Service.buildObjectKey(
      userId,
      dto.kind,
      dto.mimeType,
      dto.fileName,
    );

    const media = this.mediaRepository.create({
      objectKey,
      bucket: this.s3Service.getBucket(),
      kind: dto.kind,
      mimeType: dto.mimeType,
      size: dto.size,
      durationSeconds: dto.durationSeconds ?? null,
      status: MediaStatus.PENDING,
      uploadedById: userId,
    });

    const saved = await this.mediaRepository.save(media);
    const uploadUrl = await this.s3Service.getUploadUrl(
      objectKey,
      dto.mimeType,
      dto.size,
    );

    return {
      mediaId: saved.id,
      uploadUrl,
      objectKey,
      expiresIn: this.s3Service.getPresignExpiresIn(),
    };
  }

  async confirmUpload(
    mediaId: string,
    userId: string,
  ): Promise<MediaResponseDto> {
    const media = await this.getOwnedMedia(mediaId, userId);

    if (media.status === MediaStatus.UPLOADED) {
      return this.toResponseForUser(media, userId);
    }

    const metadata = await this.s3Service.getObjectMetadata(media.objectKey);
    if (!metadata) {
      throw new BadRequestException('File was not uploaded to storage');
    }

    const maxAllowedSize = media.size * 1.05;
    if (metadata.contentLength > maxAllowedSize) {
      await this.s3Service.deleteObject(media.objectKey);
      throw new BadRequestException('Uploaded file exceeds declared size');
    }

    if (!this.contentTypesMatch(metadata.contentType, media.mimeType)) {
      await this.s3Service.deleteObject(media.objectKey);
      throw new BadRequestException(
        'Uploaded file content type does not match declared mime type',
      );
    }

    media.size = metadata.contentLength;
    media.status = MediaStatus.UPLOADED;
    const saved = await this.mediaRepository.save(media);
    return this.toResponseForUser(saved, userId);
  }

  async getById(mediaId: string): Promise<Media | null> {
    return this.mediaRepository.findOne({ where: { id: mediaId } });
  }

  async canAccessMedia(mediaId: string, userId: string): Promise<boolean> {
    const media = await this.getById(mediaId);
    if (!media || media.status !== MediaStatus.UPLOADED) {
      return false;
    }

    if (media.uploadedById === userId) {
      return true;
    }

    if (await this.isMediaInAccessibleMessage(mediaId, userId)) {
      return true;
    }

    if (media.kind === MediaKind.AVATAR) {
      return this.isUserAvatarAccessible(mediaId, userId);
    }

    return this.isGroupAvatarAccessible(mediaId, userId);
  }

  async assertCanAccessMedia(mediaId: string, userId: string): Promise<Media> {
    const media = await this.getById(mediaId);
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (!(await this.canAccessMedia(mediaId, userId))) {
      throw new ForbiddenException('Access to media denied');
    }

    return media;
  }

  async getDownloadUrlForUser(
    mediaId: string,
    userId: string,
  ): Promise<string | null> {
    const media = await this.assertCanAccessMedia(mediaId, userId);
    return this.s3Service.getDownloadUrl(media.objectKey);
  }

  getPublicUrl(media: Media): string {
    return this.s3Service.getPublicObjectUrl(media.objectKey);
  }

  async getPublicUrlForMediaId(mediaId: string): Promise<string | null> {
    const media = await this.getById(mediaId);
    if (!media || media.status !== MediaStatus.UPLOADED) {
      return null;
    }

    return this.getPublicUrl(media);
  }

  async assertOwnedUploadedMedia(
    mediaId: string,
    userId: string,
    expectedKind?: MediaKind,
  ): Promise<Media> {
    const media = await this.getOwnedMedia(mediaId, userId);

    if (media.status !== MediaStatus.UPLOADED) {
      throw new BadRequestException('Media is not uploaded yet');
    }

    if (expectedKind && media.kind !== expectedKind) {
      throw new BadRequestException(`Expected media kind: ${expectedKind}`);
    }

    return media;
  }

  async assertMessageMedia(
    mediaId: string,
    userId: string,
    messageType: 'image' | 'video' | 'audio',
  ): Promise<Media> {
    const kindMap = {
      image: MediaKind.IMAGE,
      video: MediaKind.VIDEO,
      audio: MediaKind.AUDIO,
    } as const;

    return this.assertOwnedUploadedMedia(mediaId, userId, kindMap[messageType]);
  }

  async toResponseForUser(
    media: Media,
    userId: string,
  ): Promise<MediaResponseDto> {
    await this.assertCanAccessMedia(media.id, userId);

    const downloadUrl =
      media.status === MediaStatus.UPLOADED
        ? await this.s3Service.getDownloadUrl(media.objectKey)
        : null;

    return {
      id: media.id,
      kind: media.kind,
      mimeType: media.mimeType,
      size: media.size,
      status: media.status,
      downloadUrl,
      durationSeconds: media.durationSeconds,
      createdAt: media.createdAt,
    };
  }

  private async getOwnedMedia(mediaId: string, userId: string): Promise<Media> {
    const media = await this.getById(mediaId);
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    if (media.uploadedById !== userId) {
      throw new ForbiddenException('Media does not belong to user');
    }
    return media;
  }

  private async isMediaInAccessibleMessage(
    mediaId: string,
    userId: string,
  ): Promise<boolean> {
    const message = await this.messagesRepository.findOne({
      where: { mediaId },
    });

    if (!message) {
      return false;
    }

    return this.isParticipantOfChat(message.chatId, userId);
  }

  private async isUserAvatarAccessible(
    mediaId: string,
    userId: string,
  ): Promise<boolean> {
    const owner = await this.usersRepository.findOne({
      where: { avatarMediaId: mediaId },
    });

    if (!owner) {
      return false;
    }

    if (owner.id === userId) {
      return true;
    }

    return this.sharesChatWith(userId, owner.id);
  }

  private async isGroupAvatarAccessible(
    mediaId: string,
    userId: string,
  ): Promise<boolean> {
    const chat = await this.chatsRepository.findOne({
      where: { avatarMediaId: mediaId },
    });

    if (!chat) {
      return false;
    }

    return this.isParticipantOfChat(chat.id, userId);
  }

  private async isParticipantOfChat(
    chatId: string,
    userId: string,
  ): Promise<boolean> {
    const participation = await this.participantsRepository.findOne({
      where: { chatId, userId, leftAt: IsNull() },
    });

    return participation !== null;
  }

  private async sharesChatWith(userA: string, userB: string): Promise<boolean> {
    const count = await this.participantsRepository
      .createQueryBuilder('a')
      .innerJoin(
        ChatParticipant,
        'b',
        'b.chatId = a.chatId AND b.userId = :userB AND b.leftAt IS NULL',
        { userB },
      )
      .where('a.userId = :userA', { userA })
      .andWhere('a.leftAt IS NULL')
      .getCount();

    return count > 0;
  }

  private assertMimeType(kind: MediaKind, mimeType: string): void {
    const allowed = ALLOWED_MIME_TYPES[kind];
    if (!allowed.includes(mimeType)) {
      throw new BadRequestException(
        `Mime type ${mimeType} is not allowed for ${kind}`,
      );
    }
  }

  private contentTypesMatch(actual: string, expected: string): boolean {
    const normalize = (value: string) =>
      value.split(';')[0].trim().toLowerCase();

    return normalize(actual) === normalize(expected);
  }
}
