import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ContactSource } from '../../common/enums/contact-source.enum';
import { UsersService } from '../users/users.service';
import { ContactsService } from './contacts.service';
import { Contact } from './entities/contact.entity';

describe('ContactsService', () => {
  let service: ContactsService;
  let contactsRepository: jest.Mocked<
    Pick<Repository<Contact>, 'findOne' | 'create' | 'save' | 'remove'>
  >;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findByPhone' | 'toResponse'>
  >;

  beforeEach(async () => {
    contactsRepository = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((value: Contact) => value),
      save: jest.fn().mockImplementation((value: Contact) =>
        Promise.resolve({
          ...value,
          id: 'contact-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      remove: jest.fn(),
    };

    usersService = {
      findByPhone: jest.fn(),
      toResponse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getRepositoryToken(Contact),
          useValue: contactsRepository,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    service = module.get(ContactsService);
  });

  it('rejects adding yourself as a contact', async () => {
    usersService.findByPhone.mockResolvedValue({ id: 'user-1' } as never);

    await expect(
      service.createContact('user-1', { phone: '+79001111111' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a new contact when phone is valid', async () => {
    usersService.findByPhone.mockResolvedValue(null);
    contactsRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'contact-1',
        ownerUserId: 'user-1',
        phone: '+79001111111',
        displayName: 'Bob',
        matchedUserId: null,
        source: ContactSource.MANUAL,
        matchedUser: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Contact);

    const result = await service.createContact('user-1', {
      phone: '+79001111111',
      displayName: 'Bob',
    });

    expect(contactsRepository.save).toHaveBeenCalled();
    expect(result.phone).toBe('+79001111111');
    expect(result.displayName).toBe('Bob');
    expect(result.isRegistered).toBe(false);
  });

  it('throws when deleting missing contact', async () => {
    contactsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.deleteContact('user-1', 'missing-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('skips syncing your own phone number', async () => {
    usersService.findByPhone.mockResolvedValue({ id: 'user-1' } as never);

    const result = await service.syncContacts('user-1', [
      { phone: '+79001111111', displayName: 'Me' },
    ]);

    expect(result.synced).toBe(0);
    expect(contactsRepository.save).not.toHaveBeenCalled();
  });
});
