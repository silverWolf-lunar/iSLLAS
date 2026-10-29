import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuditAction } from '@sllas/contracts';

@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  @Index('idx_audit_actor_id')
  actorId: string | null;

  @Column({ name: 'actor_email', type: 'varchar', length: 255, nullable: true })
  actorEmail: string | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 50, nullable: true })
  actorRole: string | null;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  @Index('idx_audit_action')
  action: AuditAction;

  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  @Index('idx_audit_entity_type')
  entityType: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 255 })
  @Index('idx_audit_entity_id')
  entityId: string;

  @Column({ name: 'province_id', type: 'uuid', nullable: true })
  @Index('idx_audit_province_id')
  provinceId: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ name: 'correlation_id', type: 'varchar', length: 100, nullable: true })
  @Index('idx_audit_correlation_id')
  correlationId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Index('idx_audit_created_at')
  createdAt: Date;
}
