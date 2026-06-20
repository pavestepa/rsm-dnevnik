import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthResponseDto extends AuthTokensDto {
  user: UserResponseDto;
}
