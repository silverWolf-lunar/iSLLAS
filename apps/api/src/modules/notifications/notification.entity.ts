import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationChannel, NotificationDeliveryStatus } from '@sllas/contracts';
import { User } from '../identity/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index('idx_notifications_user')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationDeliveryStatus, default: NotificationDeliveryStatus.QUEUED })
  @Index('idx_notifications_status')
  status: NotificationDeliveryStatus;

  @Column({ name: 'template_code', type: 'varchar', length: 100, nullable: true })
  templateCode: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, unknown>;

  @Column({ name: 'deduplication_key', type: 'varchar', length: 255, nullable: true })
  deduplicationKey: string | null;

  @Column({ name: 'attempt_count', type: 'int', default: 0 })
  attemptCount: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
