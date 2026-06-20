import { IsEnum, IsUUID } from 'class-validator';
import { ChatParticipantRole } from '../../../common/enums';

export class AddParticipantDto {
  @IsUUID()
  userId: string;
}

export class UpdateParticipantRoleDto {
  @IsEnum(ChatParticipantRole)
  role: ChatParticipantRole;
}
