import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { WorkerOnly } from '../../common/decorators/worker-only.decorator';
import { WorkerAuthGuard } from '../../common/guards/worker-auth.guard';
import { OutboxService } from './outbox.service';

@Controller('outbox')
@WorkerOnly()
@UseGuards(WorkerAuthGuard)
export class OutboxStatusController {
  constructor(private readonly outboxService: OutboxService) {}

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'published' | 'failed'; message?: string },
  ) {
    if (body.status === 'published') {
      await this.outboxService.markPublished(id);
      return { ok: true, status: 'published' };
    }

    await this.outboxService.markFailed(id, body.message ?? 'Worker processing failure');
    return { ok: true, status: 'failed' };
  }
}
