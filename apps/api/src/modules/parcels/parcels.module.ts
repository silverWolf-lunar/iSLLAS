import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parcel } from './parcel.entity';
import { LandCategory } from './land-category.entity';
import { ParcelVerification } from './parcel-verification.entity';
import { AdminArea } from '../organizations/admin-area.entity';
import { ParcelsService } from './parcels.service';
import { ParcelsController } from './parcels.controller';
import { OutboxModule } from '../outbox/outbox.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Parcel, LandCategory, ParcelVerification, AdminArea]),
    OutboxModule,
    AuditModule,
  ],
  controllers: [ParcelsController],
  providers: [ParcelsService],
  exports: [ParcelsService, TypeOrmModule],
})
export class ParcelsModule {}
