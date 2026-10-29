import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { OutboxEvent } from './outbox-event.entity';
import { OutboxEventStatus, EventType } from '@sllas/contracts';

export interface EnqueueOutboxOptions {
  eventType: EventType | string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  entityManager?: EntityManager;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
  ) {}

  /**
   * Enqueue an event into the transactional outbox.
   * If an EntityManager is passed, it uses that transaction context to guarantee atomicity.
   */
  async enqueue(options: EnqueueOutboxOptions): Promise<OutboxEvent> {
    const event = new OutboxEvent();
    event.eventType = options.eventType;
    event.aggregateType = options.aggregateType;
    event.aggregateId = options.aggregateId;
    event.payload = options.payload;
    event.status = OutboxEventStatus.PENDING;
    event.retryCount = 0;

    const repo = options.entityManager ? options.entityManager.getRepository(OutboxEvent) : this.outboxRepo;
    const saved = await repo.save(event);

    this.logger.debug(
      `[OUTBOX] Enqueued event ${saved.eventType} for ${saved.aggregateType}:${saved.aggregateId} (id: ${saved.id})`,
    );

    return saved;
  }

  async getPendingEvents(batchSize: number = 50): Promise<OutboxEvent[]> {
    return this.outboxRepo.find({
      where: { status: OutboxEventStatus.PENDING },
      order: { createdAt: 'ASC' },
      take: batchSize,
    });
  }

  async markPublished(id: string): Promise<void> {
    await this.outboxRepo.update(id, {
      status: OutboxEventStatus.PUBLISHED,
      publishedAt: new Date(),
    });
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    const event = await this.outboxRepo.findOne({ where: { id } });
    if (!event) return;

    const newRetryCount = event.retryCount + 1;
    await this.outboxRepo.update(id, {
      status: newRetryCount >= 5 ? OutboxEventStatus.FAILED : OutboxEventStatus.PENDING,
      retryCount: newRetryCount,
      errorMessage,
    });
  }
}
