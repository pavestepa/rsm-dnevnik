import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EventMediaKind } from '../../../common/enums';
import { Media } from '../../media/entities/media.entity';
import { Event } from './event.entity';

@Entity('event_media')
export class EventMedia extends BaseEntity {
  @Column({ type: 'uuid' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.mediaItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column({ type: 'uuid' })
  mediaId: string;

  @ManyToOne(() => Media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mediaId' })
  media: Media;

  @Column({ type: 'enum', enum: EventMediaKind })
  kind: EventMediaKind;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'varchar', length: 256, nullable: true })
  fileName: string | null;
}
