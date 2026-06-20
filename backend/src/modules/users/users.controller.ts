import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUsersQueryDto } from './dto/search-users.dto';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUserId() userId: string) {
    return this.usersService.getById(userId, userId);
  }

  @Patch('me')
  updateMe(@CurrentUserId() userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(userId, dto);
  }

  @Get('search')
  search(@CurrentUserId() userId: string, @Query() query: SearchUsersQueryDto) {
    return this.usersService.searchUsers(userId, query.q, query.limit);
  }

  @Get(':id')
  getById(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.usersService.getById(id, userId);
  }
}
