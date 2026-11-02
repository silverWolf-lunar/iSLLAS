import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LeaseStatus } from '@sllas/contracts';
import { Lease } from '../applications/lease.entity';
import { User } from '../identity/user.entity';

@Entity('lease_status_history')
export class LeaseStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lease_id', type: 'uuid' })
  @Index('idx_lease_status_history_lease')
  leaseId: string;

  @ManyToOne(() => Lease, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lease_id' })
  lease: Lease;

  @Column({ name: 'from_status', type: 'enum', enum: LeaseStatus, nullable: true })
  fromStatus: LeaseStatus | null;

  @Column({ name: 'to_status', type: 'enum', enum: LeaseStatus })
  toStatus: LeaseStatus;

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
