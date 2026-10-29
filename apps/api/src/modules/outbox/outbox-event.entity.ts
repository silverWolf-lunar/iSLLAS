import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OutboxEventStatus, EventType } from '@sllas/contracts';

@Entity('outbox_events')
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'event_type',
    type: 'varchar',
    length: 100,
  })
  @Index('idx_outbox_event_type')
  eventType: EventType | string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 100 })
  @Index('idx_outbox_aggregate_type')
  aggregateType: string;

  @Column({ name: 'aggregate_id', type: 'varchar', length: 255 })
  @Index('idx_outbox_aggregate_id')
  aggregateId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: OutboxEventStatus,
    default: OutboxEventStatus.PENDING,
  })
  @Index('idx_outbox_status')
  status: OutboxEventStatus;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Index('idx_outbox_created_at')
  createdAt: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;
}
