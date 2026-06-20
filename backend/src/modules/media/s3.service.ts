import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { MediaKind } from '../../common/enums';

const EXTENSION_BY_MIME: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'image/gif': ['.gif'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/webm': ['.webm'],
  'audio/mpeg': ['.mp3'],
  'audio/mp4': ['.m4a'],
  'audio/ogg': ['.ogg'],
  'audio/webm': ['.weba'],
  'audio/aac': ['.aac'],
};

const BLOCKED_EXTENSIONS = new Set([
  '.html',
  '.htm',
  '.svg',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
]);

export interface S3ObjectMetadata {
  contentType: string;
  contentLength: number;
}

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly uploadClient: S3Client;
  private readonly bucket: string;
  private readonly presignExpiresIn: number;
  private readonly publicBaseUrl: string;
  private readonly forcePathStyle: boolean;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('s3.endpoint');
    const region = this.configService.get<string>('s3.region') ?? 'us-east-1';
    const accessKeyId = this.configService.get<string>('s3.accessKeyId') ?? '';
    const secretAccessKey =
      this.configService.get<string>('s3.secretAccessKey') ?? '';
    const forcePathStyle =
      this.configService.get<boolean>('s3.forcePathStyle') ?? true;

    this.bucket = this.configService.get<string>('s3.bucket') ?? 'rsm-dnevnik';
    this.presignExpiresIn =
      this.configService.get<number>('s3.presignExpiresIn') ?? 3600;
    this.publicBaseUrl =
      this.configService.get<string>('s3.publicBaseUrl') ??
      endpoint ??
      '';
    this.forcePathStyle = forcePathStyle;

    const credentials =
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined;

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle,
      credentials,
    });

    this.uploadClient = new S3Client({
      region,
      endpoint: this.publicBaseUrl || endpoint || undefined,
      forcePathStyle,
      credentials,
    });
  }

  async onModuleInit(): Promise<void> {
    if (!this.shouldEnsureBucketOnStartup()) {
      return;
    }

    await this.ensureBucket();
  }

  async ensureBucket(): Promise<void> {
    const endpoint = this.configService.get<string>('s3.endpoint') ?? 'default';

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(
        `S3 ready: bucket "${this.bucket}" at ${endpoint}`,
      );
      await this.ensureAvatarPublicRead();
      return;
    } catch (error) {
      if (!this.isMissingBucketError(error)) {
        this.logS3ConnectionHelp(error, endpoint);
        throw error;
      }
    }

    try {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(
        `S3 bucket "${this.bucket}" created at ${endpoint}`,
      );
      await this.ensureAvatarPublicRead();
    } catch (error) {
      this.logS3ConnectionHelp(error, endpoint);
      throw error;
    }
  }

  async ping(): Promise<{ ok: true; bucket: string; endpoint: string }> {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    return {
      ok: true,
      bucket: this.bucket,
      endpoint: this.configService.get<string>('s3.endpoint') ?? '',
    };
  }

  private shouldEnsureBucketOnStartup(): boolean {
    if (this.configService.get<string>('nodeEnv') === 'test') {
      return false;
    }

    return this.configService.get<boolean>('s3.ensureBucketOnStartup') ?? false;
  }

  private isMissingBucketError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const name = 'name' in error ? String(error.name) : '';
    const status =
      '$metadata' in error &&
      error.$metadata &&
      typeof error.$metadata === 'object' &&
      'httpStatusCode' in error.$metadata
        ? Number(error.$metadata.httpStatusCode)
        : undefined;

    return name === 'NotFound' || name === 'NoSuchBucket' || status === 404;
  }

  private logS3ConnectionHelp(error: unknown, endpoint: string): void {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(
      `S3 unavailable at ${endpoint} (bucket "${this.bucket}"): ${message}. ` +
        'Run "pnpm infra:up" from the repo root to start MinIO.',
    );
  }

  buildObjectKey(
    userId: string,
    kind: MediaKind,
    mimeType: string,
    fileName?: string,
  ): string {
    const extension = this.resolveExtension(fileName, mimeType);
    return `${kind}/${userId}/${randomUUID()}${extension}`;
  }

  async getUploadUrl(
    objectKey: string,
    mimeType: string,
    _size: number,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: mimeType,
    });

    return getSignedUrl(this.uploadClient, command, {
      expiresIn: this.presignExpiresIn,
    });
  }

  getPublicObjectUrl(objectKey: string): string {
    const baseUrl = this.publicBaseUrl.replace(/\/$/, '');

    if (this.forcePathStyle) {
      return `${baseUrl}/${this.bucket}/${objectKey}`;
    }

    return `${baseUrl}/${objectKey}`;
  }

  async ensureAvatarPublicRead(): Promise<void> {
    if (!this.shouldEnsureBucketOnStartup()) {
      return;
    }

    try {
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucket}/avatar/*`],
              },
            ],
          }),
        }),
      );
      this.logger.log(`Public read enabled for s3://${this.bucket}/avatar/*`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Could not set public read policy for avatar objects: ${message}`,
      );
    }
  }

  async getDownloadUrl(objectKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: this.presignExpiresIn,
    });
  }

  async getObjectMetadata(objectKey: string): Promise<S3ObjectMetadata | null> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );

      if (
        response.ContentType === undefined ||
        response.ContentLength === undefined
      ) {
        return null;
      }

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
      };
    } catch {
      return null;
    }
  }

  async objectExists(objectKey: string): Promise<boolean> {
    const metadata = await this.getObjectMetadata(objectKey);
    return metadata !== null;
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
  }

  getBucket(): string {
    return this.bucket;
  }

  getPresignExpiresIn(): number {
    return this.presignExpiresIn;
  }

  private resolveExtension(fileName: string | undefined, mimeType: string): string {
    const clientExtension = fileName?.includes('.')
      ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
      : '';

    if (clientExtension && BLOCKED_EXTENSIONS.has(clientExtension)) {
      throw new BadRequestException(
        `File extension ${clientExtension} is not allowed`,
      );
    }

    const allowedExtensions = EXTENSION_BY_MIME[mimeType];
    if (!allowedExtensions) {
      throw new BadRequestException(`Unsupported mime type: ${mimeType}`);
    }

    if (
      clientExtension &&
      !allowedExtensions.includes(clientExtension)
    ) {
      throw new BadRequestException(
        `File extension ${clientExtension} does not match mime type ${mimeType}`,
      );
    }

    return clientExtension || allowedExtensions[0];
  }
}
