import { Body, Controller, Delete, Post } from '@nestjs/common';
import { PushService } from './push.service';
import { RegisterPushTokenDto } from './dto/push.dto';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('push')
@ApiBearerAuth()
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('register')
  register(@CurrentUserId() userId: string, @Body() dto: RegisterPushTokenDto) {
    return this.pushService.registerToken(userId, dto);
  }

  @Delete('register')
  unregister(
    @CurrentUserId() userId: string,
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.pushService.unregisterToken(userId, dto.expoPushToken);
  }
}
