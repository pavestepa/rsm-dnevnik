import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { ContactsService } from './contacts.service';
import { CreateContactDto, SyncContactsDto } from './dto/contact.dto';

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  list(@CurrentUserId() userId: string, @Query('q') query?: string) {
    return this.contactsService.listContacts(userId, query);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateContactDto) {
    return this.contactsService.createContact(userId, dto);
  }

  @Post('sync')
  sync(@CurrentUserId() userId: string, @Body() dto: SyncContactsDto) {
    return this.contactsService.syncContacts(userId, dto.contacts);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') contactId: string) {
    return this.contactsService.deleteContact(userId, contactId);
  }
}
