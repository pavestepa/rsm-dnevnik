import { IsEnum, IsString, MaxLength } from 'class-validator';
import { PushPlatform } from '../entities/push-token.entity';

export class RegisterPushTokenDto {
  @IsString()
  @MaxLength(512)
  expoPushToken: string;

  @IsEnum(PushPlatform)
  platform: PushPlatform;
}
