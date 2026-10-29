import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditEvent } from './audit-event.entity';
import { AuditAction } from '@sllas/contracts';

export interface CreateAuditRecord {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  provinceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
  entityManager?: EntityManager;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
  ) {}

  async logEvent(record: CreateAuditRecord): Promise<AuditEvent> {
    const sanitizedMetadata = this.sanitizeMetadata(record.metadata || {});

    const { entityManager, ...eventRecord } = record;
    const repo = entityManager ? entityManager.getRepository(AuditEvent) : this.auditRepo;
    const event = repo.create({
      ...eventRecord,
      metadata: sanitizedMetadata,
    });

    const saved = await repo.save(event);
    this.logger.log(
      `[AUDIT] Action=${record.action} Entity=${record.entityType}:${record.entityId} Actor=${record.actorEmail || 'SYSTEM'} CorrId=${record.correlationId}`,
    );
    return saved;
  }

  async queryEvents(filters: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    provinceId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ events: AuditEvent[]; count: number }> {
    const qb = this.auditRepo.createQueryBuilder('audit');

    if (filters.entityType) {
      qb.andWhere('audit.entity_type = :entityType', { entityType: filters.entityType });
    }
    if (filters.entityId) {
      qb.andWhere('audit.entity_id = :entityId', { entityId: filters.entityId });
    }
    if (filters.actorId) {
      qb.andWhere('audit.actor_id = :actorId', { actorId: filters.actorId });
    }
    if (filters.provinceId) {
      qb.andWhere('audit.province_id = :provinceId', { provinceId: filters.provinceId });
    }

    qb.orderBy('audit.created_at', 'DESC').take(filters.limit || 50);

    const [events, count] = await qb.getManyAndCount();
    return { events, count };
  }

  /**
   * Remove any sensitive credentials, tokens, or raw personal data from audit logs
   */
  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'token', 'secret', 'nationalIdNumber', 'bankAccount'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
