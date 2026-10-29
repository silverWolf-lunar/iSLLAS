import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEvent } from './audit-event.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditEvent])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
