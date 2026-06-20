import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import {
  CreateMessageDto,
  SearchMessagesQueryDto,
  UpdateMessageDto,
} from './dto/message.dto';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('chats/:chatId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  list(
    @CurrentUserId() userId: string,
    @Param('chatId') chatId: string,
    @Query() pagination: CursorPaginationDto,
  ) {
    return this.messagesService.listMessages(userId, chatId, pagination);
  }

  @Get('search')
  search(
    @CurrentUserId() userId: string,
    @Param('chatId') chatId: string,
    @Query() query: SearchMessagesQueryDto,
  ) {
    return this.messagesService.searchMessages(userId, chatId, query.q, query);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Param('chatId') chatId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.createMessage(userId, chatId, dto);
  }

  @Patch(':messageId')
  update(
    @CurrentUserId() userId: string,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.updateMessage(userId, chatId, messageId, dto);
  }

  @Delete(':messageId')
  delete(
    @CurrentUserId() userId: string,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.deleteMessage(userId, chatId, messageId);
  }
}
