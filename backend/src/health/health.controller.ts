import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../modules/media/s3.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {}

  @Public()
  @Get()
  async check() {
    const response: {
      status: string;
      timestamp: string;
      s3?: { status: string; bucket?: string; endpoint?: string; error?: string };
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
}
