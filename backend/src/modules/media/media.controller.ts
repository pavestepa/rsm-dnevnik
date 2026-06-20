import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { PresignUploadDto } from './dto/media.dto';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presign')
  presign(@CurrentUserId() userId: string, @Body() dto: PresignUploadDto) {
    return this.mediaService.createPresignedUpload(userId, dto);
  }

  @Post(':id/confirm')
  confirm(@CurrentUserId() userId: string, @Param('id') mediaId: string) {
    return this.mediaService.confirmUpload(mediaId, userId);
  }

  @Get(':id')
  async getById(
    @CurrentUserId() userId: string,
    @Param('id') mediaId: string,
  ) {
    const media = await this.mediaService.getById(mediaId);
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    return this.mediaService.toResponseForUser(media, userId);
  }
}
