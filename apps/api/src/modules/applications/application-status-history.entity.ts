import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApplicationStatus } from '@sllas/contracts';
import { LeaseApplication } from './lease-application.entity';
import { User } from '../identity/user.entity';

@Entity('application_status_history')
export class ApplicationStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'application_id', type: 'uuid' })
  @Index('idx_application_status_history_application')
  applicationId: string;

  @ManyToOne(() => LeaseApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: LeaseApplication;

  @Column({ name: 'from_status', type: 'enum', enum: ApplicationStatus, nullable: true })
  fromStatus: ApplicationStatus | null;

  @Column({ name: 'to_status', type: 'enum', enum: ApplicationStatus })
  toStatus: ApplicationStatus;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
