import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Chat } from '../../chats/entities/chat.entity';
import { EventMedia } from './event-media.entity';

@Entity('events')
export class Event extends BaseEntity {
  @Column({ type: 'varchar', length: 256 })
  title: string;

  @Column({ type: 'text', default: '' })
  body: string;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'uuid' })
  groupChatId: string;

  @ManyToOne(() => Chat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupChatId' })
  groupChat: Chat;

  @Column({ type: 'uuid', unique: true })
  chatId: string;

  @ManyToOne(() => Chat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat: Chat;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => EventMedia, (media) => media.event)
  mediaItems: EventMedia[];
}
