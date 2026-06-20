import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ChatParticipantRole } from '../../../common/enums';
import { Chat } from './chat.entity';
import { User } from '../../users/entities/user.entity';
import { Message } from '../../messages/entities/message.entity';

@Entity('chat_participants')
@Unique(['chatId', 'userId'])
@Index(['userId'])
export class ChatParticipant extends BaseEntity {
  @Column({ type: 'uuid' })
  chatId: string;

  @ManyToOne(() => Chat, (chat) => chat.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat: Chat;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.chatParticipants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ChatParticipantRole,
    default: ChatParticipantRole.MEMBER,
  })
  role: ChatParticipantRole;

  @Column({ type: 'uuid', nullable: true })
  lastReadMessageId: string | null;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lastReadMessageId' })
  lastReadMessage: Message | null;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  pinnedAt: Date | null;
}
