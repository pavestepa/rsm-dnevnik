import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MessageReceiptStatus } from '../../../common/enums';
import { Message } from './message.entity';
import { User } from '../../users/entities/user.entity';

@Entity('message_receipts')
@Unique(['messageId', 'userId'])
@Index(['messageId'])
@Index(['userId'])
export class MessageReceipt extends BaseEntity {
  @Column({ type: 'uuid' })
  messageId: string;

  @ManyToOne(() => Message, (message) => message.receipts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: MessageReceiptStatus })
  status: MessageReceiptStatus;

  @UpdateDateColumn({ type: 'timestamptz' })
  statusUpdatedAt: Date;
}
