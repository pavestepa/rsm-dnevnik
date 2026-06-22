import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSource } from '../../common/enums/contact-source.enum';
import { normalizePhone } from '../../common/utils/phone.util';
import { UsersService } from '../users/users.service';
import { Contact } from './entities/contact.entity';
import {
  ContactResponseDto,
  CreateContactDto,
  SyncContactItemDto,
} from './dto/contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
    private readonly usersService: UsersService,
  ) {}

  async listContacts(
    ownerUserId: string,
    query?: string,
  ): Promise<ContactResponseDto[]> {
    const qb = this.contactsRepository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.matchedUser', 'matchedUser')
      .leftJoinAndSelect('matchedUser.avatarMedia', 'avatarMedia')
      .where('contact.ownerUserId = :ownerUserId', { ownerUserId })
      .orderBy('contact.displayName', 'ASC');

    if (query?.trim()) {
      const normalized = query.trim();
      const digits = normalized.replace(/\D/g, '');

      if (digits.length >= 3) {
        qb.andWhere(
          '(contact.displayName ILIKE :name OR contact.phone LIKE :phone)',
          {
            name: `%${normalized}%`,
            phone: `%${digits}%`,
          },
        );
      } else {
        qb.andWhere('contact.displayName ILIKE :name', {
          name: `%${normalized}%`,
        });
      }
    }

    const contacts = await qb.getMany();
    return Promise.all(
      contacts.map((contact) => this.toResponse(contact, ownerUserId)),
    );
  }

  async createContact(
    ownerUserId: string,
    dto: CreateContactDto,
  ): Promise<ContactResponseDto> {
    const phone = normalizePhone(dto.phone);

    if (phone.length < 8) {
      throw new BadRequestException('Invalid phone number');
    }

    const matchedUser = await this.usersService.findByPhone(phone);
    if (matchedUser?.id === ownerUserId) {
      throw new BadRequestException({
        message: 'Cannot add yourself as a contact',
        code: 'CONTACT_SELF',
      });
    }

    const displayName = dto.displayName?.trim() || matchedUser?.name || phone;

    let contact = await this.contactsRepository.findOne({
      where: { ownerUserId, phone },
      relations: { matchedUser: { avatarMedia: true } },
    });

    if (contact) {
      contact.displayName = displayName;
      contact.matchedUserId = matchedUser?.id ?? null;
      contact.source = ContactSource.MANUAL;
    } else {
      contact = this.contactsRepository.create({
        ownerUserId,
        phone,
        displayName,
        matchedUserId: matchedUser?.id ?? null,
        source: ContactSource.MANUAL,
      });
    }

    const saved = await this.contactsRepository.save(contact);
    const reloaded = await this.contactsRepository.findOne({
      where: { id: saved.id },
      relations: { matchedUser: { avatarMedia: true } },
    });

    return this.toResponse(reloaded!, ownerUserId);
  }

  async syncContacts(
    ownerUserId: string,
    items: SyncContactItemDto[],
  ): Promise<{ synced: number }> {
    let synced = 0;

    for (const item of items) {
      const phone = normalizePhone(item.phone);
      if (phone.length < 8) {
        continue;
      }

      const matchedUser = await this.usersService.findByPhone(phone);
      if (matchedUser?.id === ownerUserId) {
        continue;
      }

      const displayName =
        item.displayName?.trim() || matchedUser?.name || phone;

      const existing = await this.contactsRepository.findOne({
        where: { ownerUserId, phone },
      });

      if (existing?.source === ContactSource.MANUAL) {
        if (!existing.matchedUserId && matchedUser) {
          existing.matchedUserId = matchedUser.id;
          await this.contactsRepository.save(existing);
        }
        continue;
      }

      if (existing) {
        existing.displayName = displayName;
        existing.matchedUserId = matchedUser?.id ?? null;
        existing.source = ContactSource.DEVICE;
        await this.contactsRepository.save(existing);
      } else {
        await this.contactsRepository.save(
          this.contactsRepository.create({
            ownerUserId,
            phone,
            displayName,
            matchedUserId: matchedUser?.id ?? null,
            source: ContactSource.DEVICE,
          }),
        );
      }

      synced += 1;
    }

    return { synced };
  }

  async deleteContact(ownerUserId: string, contactId: string): Promise<void> {
    const contact = await this.contactsRepository.findOne({
      where: { id: contactId, ownerUserId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.contactsRepository.remove(contact);
  }

  private async toResponse(
    contact: Contact,
    requesterId: string,
  ): Promise<ContactResponseDto> {
    let matchedUserAvatarUrl: string | null = null;
    let matchedUserName: string | null = null;

    if (contact.matchedUser) {
      const userDto = await this.usersService.toResponse(
        contact.matchedUser,
        requesterId,
      );
      matchedUserAvatarUrl = userDto.avatarUrl;
      matchedUserName = userDto.name;
    }

    return {
      id: contact.id,
      phone: contact.phone,
      displayName: contact.displayName,
      matchedUserId: contact.matchedUserId,
      matchedUserName,
      matchedUserAvatarUrl,
      isRegistered: Boolean(contact.matchedUserId),
      source: contact.source,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }
}
