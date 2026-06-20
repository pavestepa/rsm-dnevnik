import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, AuthTokensDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { getRequestId } from '../../common/context/request-context';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async login(dto: LoginDto, ip?: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findByLoginOrPhone(dto.login);
    if (!user) {
      this.logFailedLogin(dto.login, ip);
      throw new UnauthorizedException('Invalid login or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      this.logFailedLogin(dto.login, ip);
      throw new UnauthorizedException('Invalid login or password');
    }

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      user: await this.usersService.toResponse(user, user.id),
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.refreshTokensRepository.findOne({
      where: { tokenHash },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedException('User is no longer available');
    }

    storedToken.revokedAt = new Date();
    await this.refreshTokensRepository.save(storedToken);

    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.refreshTokensRepository.findOne({
      where: { tokenHash },
    });

    if (storedToken && !storedToken.revokedAt) {
      storedToken.revokedAt = new Date();
      await this.refreshTokensRepository.save(storedToken);
    }

    return { success: true };
  }

  private async issueTokens(user: User): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      login: user.login,
    };

    const expiresIn =
      this.configService.get<number>('auth.accessTokenExpiresIn') ?? 900;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('auth.accessTokenSecret'),
      expiresIn,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenTtlDays =
      this.configService.get<number>('auth.refreshTokenExpiresInDays') ?? 7;

    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(
          Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000,
        ),
        revokedAt: null,
      }),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private logFailedLogin(login: string, ip?: string): void {
    this.logger.warn(
      `Failed login attempt: ${JSON.stringify({
        login,
        ip: ip ?? 'unknown',
        requestId: getRequestId(),
      })}`,
    );
  }
}
