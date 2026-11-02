import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lease } from '../applications/lease.entity';
import { Parcel } from '../parcels/parcel.entity';
import { LeaseStatusHistory } from './lease-status-history.entity';
import { LeasesController } from './leases.controller';
import { LeasesService } from './leases.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lease, Parcel, LeaseStatusHistory])],
  controllers: [LeasesController],
  providers: [LeasesService],
  exports: [LeasesService],
})
export class LeasesModule {}
