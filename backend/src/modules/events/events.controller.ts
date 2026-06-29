import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  EventDetailDto,
  UpdateEventDto,
} from './dto/event.dto';
import {
  CursorPaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { EventListItemDto } from './dto/event.dto';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  listEvents(
    @CurrentUserId() userId: string,
    @Query() pagination: CursorPaginationDto,
  ): Promise<PaginatedResult<EventListItemDto>> {
    return this.eventsService.listEvents(userId, pagination);
  }

  @Get(':id')
  getEvent(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
  ): Promise<EventDetailDto> {
    return this.eventsService.getEventById(userId, eventId);
  }

  @Post()
  createEvent(
    @CurrentUserId() userId: string,
    @Body() dto: CreateEventDto,
  ): Promise<EventDetailDto> {
    return this.eventsService.createEvent(userId, dto);
  }

  @Patch(':id')
  updateEvent(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: UpdateEventDto,
  ): Promise<EventDetailDto> {
    return this.eventsService.updateEvent(userId, eventId, dto);
  }

  @Delete(':id')
  deleteEvent(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
  ): Promise<{ success: true }> {
    return this.eventsService.deleteEvent(userId, eventId);
  }
}
