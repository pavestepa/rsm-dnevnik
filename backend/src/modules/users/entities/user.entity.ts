import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ChatParticipant } from '../../chats/entities/chat-participant.entity';
import { Message } from '../../messages/entities/message.entity';
import { Media } from '../../media/entities/media.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 128, unique: true })
  login: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 32, unique: true, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  bio: string | null;

  @Column({ type: 'uuid', nullable: true })
  avatarMediaId: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  avatarUrl: string | null;

  @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'avatarMediaId' })
  avatarMedia: Media | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ChatParticipant, (participant) => participant.user)
  chatParticipants: ChatParticipant[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];
}
