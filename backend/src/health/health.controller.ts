import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { S3Service } from '../modules/media/s3.service';
import { Public } from '../common/decorators/public.decorator';
import { REDIS_CLIENT } from '../redis/redis.constants';

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Public()
  @Get()
  async check() {
    const response: {
      status: string;
      timestamp: string;
      s3?: {
        status: string;
        bucket?: string;
        endpoint?: string;
        error?: string;
      };
    } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };

    if (this.configService.get<string>('nodeEnv') === 'development') {
      try {
        const s3 = await this.s3Service.ping();
        response.s3 = {
          status: 'ok',
          bucket: s3.bucket,
          endpoint: s3.endpoint,
        };
      } catch (error) {
        response.s3 = {
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return response;
  }

  @Public()
  @Get('ready')
  async readiness() {
    const checks: Record<string, { status: 'ok' | 'error'; error?: string }> =
      {};

    try {
      await this.dataSource.query('SELECT 1');
      checks.postgres = { status: 'ok' };
    } catch (error) {
      checks.postgres = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }

    try {
      const pong = await this.redis.ping();
      checks.redis = { status: pong === 'PONG' ? 'ok' : 'error' };
    } catch (error) {
      checks.redis = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }

    const isReady = Object.values(checks).every(
      (check) => check.status === 'ok',
    );

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
