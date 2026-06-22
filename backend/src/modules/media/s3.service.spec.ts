import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { MediaKind } from '../../common/enums';

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                's3.endpoint': 'http://localhost:9000',
                's3.region': 'us-east-1',
                's3.accessKeyId': 'minioadmin',
                's3.secretAccessKey': 'minioadmin',
                's3.forcePathStyle': true,
                's3.bucket': 'test-bucket',
                's3.presignExpiresIn': 3600,
                's3.publicBaseUrl': 'http://localhost:9000',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get(S3Service);
  });

  it('rejects blocked extensions', () => {
    expect(() =>
      service.buildObjectKey(
        'user-1',
        MediaKind.IMAGE,
        'image/svg+xml',
        'evil.svg',
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects extension mismatch', () => {
    expect(() =>
      service.buildObjectKey(
        'user-1',
        MediaKind.IMAGE,
        'image/png',
        'photo.jpg',
      ),
    ).toThrow(BadRequestException);
  });

  it('accepts matching extension', () => {
    const key = service.buildObjectKey(
      'user-1',
      MediaKind.IMAGE,
      'image/png',
      'photo.png',
    );
    expect(key).toContain('.png');
  });

  it('builds public object url for path-style endpoints', () => {
    expect(service.getPublicObjectUrl('avatar/user-1/photo.jpg')).toBe(
      'http://localhost:9000/test-bucket/avatar/user-1/photo.jpg',
    );
  });
});
