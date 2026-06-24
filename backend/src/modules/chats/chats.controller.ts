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
import { ChatsService } from './chats.service';
import {
  CreateDirectChatDto,
  CreateGroupChatDto,
  UpdateGroupChatDto,
} from './dto/chat.dto';
import {
  AddParticipantDto,
  UpdateParticipantRoleDto,
} from './dto/group-management.dto';
import { MarkChatReadDto } from '../messages/dto/message.dto';
import { MessagesService } from '../messages/messages.service';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('chats')
@ApiBearerAuth()
@Controller('chats')
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get()
  list(@CurrentUserId() userId: string, @Query('q') query?: string) {
    return this.chatsService.listChats(userId, query);
  }

  @Post('direct')
  createDirect(
    @CurrentUserId() userId: string,
    @Body() dto: CreateDirectChatDto,
  ) {
    return this.chatsService.createDirectChat(userId, dto);
  }

  @Post('group')
  createGroup(
    @CurrentUserId() userId: string,
    @Body() dto: CreateGroupChatDto,
  ) {
    return this.chatsService.createGroupChat(userId, dto);
  }

  @Get(':chatId')
  getById(@CurrentUserId() userId: string, @Param('chatId') chatId: string) {
    return this.chatsService.getChatById(userId, chatId);
  }

  @Patch(':chatId')
  updateGroup(
    @CurrentUserId() userId: string,
    @Param('chatId') chatId: string,
    @Body() dto: UpdateGroupChatDto,
  ) {
    return this.chatsService.updateGroupChat(userId, chatId, dto);
  }

  @Delete(':chatId')
  deleteGroup(
    @CurrentUserId() userId: string,
    @Param('chatId') chatId: string,
  ) {
    return this.chatsService.deleteGroupChat(userId, chatId);
  }

  @Post(':chatId/participants')
  addParticipant(
    @CurrentUserId() userId: string,
    @Param('chatId') chatId: string,
    @Body() dto: AddParticipantDto,
  ) {
    return this.chatsService.addParticipant(userId, chatId, dto.userId);
  }

  @Delete(':chatId/participants/:targetUserId')
  removeParticipant(
    @CurrentUserId() userId: string,
    @Param('chatId') chatId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.chatsService.removeParticipant(userId, chatId, targetUserId);
  }

  @Patch(':chatId/participants/:targetUserId/role')
  updateParticipantRole(
    @CurrentUserId() userId: string,
    @Param('chatId') chatId: string,
    @Param('targetUserId') targetUserId: string,
    @Body() dto: UpdateParticipantRoleDto,
  ) {
    return this.chatsService.updateParticipantRole(
      userId,
      chatId,
      targetUserId,
      dto.role,
    );
  }

  @Post(':chatId/leave')
  leaveGroup(@CurrentUserId() userId: string, @Param('chatId') chatId: string) {
    return this.chatsService.leaveGroup(userId, chatId);
  }

  @Post(':chatId/read')
  markRead(
    @CurrentUserId() userId: string,
    @Param('chatId') chatId: string,
    @Body() dto: MarkChatReadDto,
  ) {
    return this.messagesService.markChatAsRead(userId, chatId, dto);
  }

  @Post(':chatId/pin')
  pinChat(@CurrentUserId() userId: string, @Param('chatId') chatId: string) {
    return this.chatsService.pinChat(userId, chatId);
  }

  @Post(':chatId/unpin')
  unpinChat(@CurrentUserId() userId: string, @Param('chatId') chatId: string) {
    return this.chatsService.unpinChat(userId, chatId);
  }
}
