import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { MediaService } from '../media/media.service';
import { MediaKind } from '../../common/enums';
import { normalizePhone } from '../../common/utils/phone.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly mediaService: MediaService,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id, isActive: true },
      relations: { avatarMedia: true },
    });
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.login) = LOWER(:login)', { login })
      .andWhere('user.isActive = true')
      .getOne();
  }

  async findByPhone(phone: string): Promise<User | null> {
    const normalized = normalizePhone(phone);

    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.phone = :phone', { phone: normalized })
      .andWhere('user.isActive = true')
      .getOne();
  }

  async findByLoginOrPhone(identifier: string): Promise<User | null> {
    const byLogin = await this.findByLogin(identifier);
    if (byLogin) {
      return byLogin;
    }

    return this.findByPhone(identifier);
  }

  async getById(id: string, requesterId: string): Promise<UserResponseDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toResponse(user, requesterId);
  }

  async searchUsers(
    requesterId: string,
    query: string,
    limit = 20,
  ): Promise<UserResponseDto[]> {
    const normalized = query.trim();
    if (normalized.length < 2) {
      return [];
    }

    const digits = normalized.replace(/\D/g, '');
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.avatarMedia', 'avatarMedia')
      .where('user.isActive = true')
      .andWhere('user.id != :requesterId', { requesterId })
      .take(Math.min(limit, 50));

    if (digits.length >= 3) {
      qb.andWhere('(user.name ILIKE :name OR user.phone LIKE :phone)', {
        name: `%${normalized}%`,
        phone: `%${digits}%`,
      });
    } else {
      qb.andWhere('user.name ILIKE :name', { name: `%${normalized}%` });
    }

    const users = await qb.orderBy('user.name', 'ASC').getMany();

    return Promise.all(users.map((user) => this.toResponse(user, requesterId)));
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.avatarMediaId !== undefined) {
      if (dto.avatarMediaId === null) {
        user.avatarMediaId = null;
        user.avatarUrl = null;
      } else {
        const media = await this.mediaService.assertOwnedUploadedMedia(
          dto.avatarMediaId,
          id,
          MediaKind.AVATAR,
        );
        user.avatarMediaId = dto.avatarMediaId;
        user.avatarUrl = this.mediaService.getPublicUrl(media);
      }
    }

    Object.assign(user, {
      name: dto.name ?? user.name,
      bio: dto.bio !== undefined ? dto.bio : user.bio,
    });

    const saved = await this.usersRepository.save(user);
    return this.toResponse(saved, id);
  }

  async toResponse(user: User, requesterId: string): Promise<UserResponseDto> {
    let avatarUrl = await this.resolveAvatarUrl(user, requesterId);

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      bio: user.bio,
      avatarMediaId: user.avatarMediaId,
      avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async resolveAvatarUrl(
    user: User,
    requesterId: string,
  ): Promise<string | null> {
    if (!user.avatarMediaId) {
      return null;
    }

    if (user.avatarUrl) {
      return user.avatarUrl;
    }

    const publicUrl = await this.mediaService.getPublicUrlForMediaId(
      user.avatarMediaId,
    );
    if (publicUrl) {
      user.avatarUrl = publicUrl;
      await this.usersRepository.save(user);
      return publicUrl;
    }

    try {
      return await this.mediaService.getDownloadUrlForUser(
        user.avatarMediaId,
        requesterId,
      );
    } catch {
      return null;
    }
  }
}
