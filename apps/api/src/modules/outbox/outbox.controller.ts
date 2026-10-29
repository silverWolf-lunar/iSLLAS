import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WorkerOnly } from '../../common/decorators/worker-only.decorator';
import { WorkerAuthGuard } from '../../common/guards/worker-auth.guard';
import { OutboxService } from './outbox.service';

@Controller('outbox')
@WorkerOnly()
@UseGuards(WorkerAuthGuard)
export class OutboxController {
  constructor(private readonly outboxService: OutboxService) {}

  @Get('pending')
  async getPendingEvents(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit ?? 50);
    const batchSize = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;

    const events = await this.outboxService.getPendingEvents(batchSize);
    return events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload ?? {},
      createdAt: event.createdAt,
      status: event.status,
      retryCount: event.retryCount,
      publishedAt: event.publishedAt,
    }));
  }
}
