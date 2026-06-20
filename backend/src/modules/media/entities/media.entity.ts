import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MediaKind, MediaStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity('media')
export class Media extends BaseEntity {
  @Column({ type: 'varchar', length: 512, unique: true })
  objectKey: string;

  @Column({ type: 'varchar', length: 128 })
  bucket: string;

  @Column({ type: 'enum', enum: MediaKind })
  kind: MediaKind;

  @Column({ type: 'varchar', length: 128 })
  mimeType: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'enum', enum: MediaStatus, default: MediaStatus.PENDING })
  status: MediaStatus;

  @Column({ type: 'float', nullable: true })
  durationSeconds: number | null;

  @Column({ type: 'uuid' })
  uploadedById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;
}
