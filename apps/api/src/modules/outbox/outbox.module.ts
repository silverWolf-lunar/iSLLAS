import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from './outbox-event.entity';
import { OutboxService } from './outbox.service';
import { OutboxController } from './outbox.controller';
import { OutboxStatusController } from './outbox-status.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent])],
  controllers: [OutboxController, OutboxStatusController],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
