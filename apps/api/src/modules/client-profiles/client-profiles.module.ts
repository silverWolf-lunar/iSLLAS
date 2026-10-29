import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientProfile } from './client-profile.entity';
import { ClientProfilesController } from './client-profiles.controller';
import { ClientProfilesService } from './client-profiles.service';
import { OutboxModule } from '../outbox/outbox.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClientProfile]), OutboxModule, AuditModule],
  controllers: [ClientProfilesController],
  providers: [ClientProfilesService],
  exports: [ClientProfilesService, TypeOrmModule],
})
export class ClientProfilesModule {}
