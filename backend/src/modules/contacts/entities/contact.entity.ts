import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ContactSource } from '../../../common/enums/contact-source.enum';
import { User } from '../../users/entities/user.entity';

@Entity('contacts')
@Unique(['ownerUserId', 'phone'])
@Index(['ownerUserId'])
export class Contact extends BaseEntity {
  @Column({ type: 'uuid' })
  ownerUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerUserId' })
  owner: User;

  @Column({ type: 'varchar', length: 32 })
  phone: string;

  @Column({ type: 'varchar', length: 128 })
  displayName: string;

  @Column({ type: 'uuid', nullable: true })
  matchedUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'matchedUserId' })
  matchedUser: User | null;

  @Column({ type: 'enum', enum: ContactSource, default: ContactSource.MANUAL })
  source: ContactSource;
}
