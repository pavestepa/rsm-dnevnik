import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum PushPlatform {
  IOS = 'ios',
  ANDROID = 'android',
}

@Entity('push_tokens')
@Index(['userId'])
export class PushToken extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 512, unique: true })
  expoPushToken: string;

  @Column({ type: 'enum', enum: PushPlatform })
  platform: PushPlatform;

  @Column({ type: 'timestamptz' })
  lastUsedAt: Date;
}
