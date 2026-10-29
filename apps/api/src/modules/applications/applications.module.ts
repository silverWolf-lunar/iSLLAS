import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientProfile } from '../client-profiles/client-profile.entity';
import { Parcel } from '../parcels/parcel.entity';
import { AuditModule } from '../audit/audit.module';
import { OutboxModule } from '../outbox/outbox.module';
import { ApplicationStatusHistory } from './application-status-history.entity';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { LeaseApplication } from './lease-application.entity';
import { Lease } from './lease.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaseApplication, ApplicationStatusHistory, Lease, ClientProfile, Parcel]),
    OutboxModule,
    AuditModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService, TypeOrmModule],
})
export class ApplicationsModule {}
