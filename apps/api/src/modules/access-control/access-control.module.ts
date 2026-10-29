import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './role.entity';
import { Permission } from './permission.entity';
import { AccessControlService } from './access-control.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JurisdictionGuard } from '../../common/guards/jurisdiction.guard';
import { SegregationOfDutiesGuard } from '../../common/guards/segregation-of-duties.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, Permission])],
  providers: [AccessControlService, RolesGuard, JurisdictionGuard, SegregationOfDutiesGuard],
  exports: [AccessControlService, RolesGuard, JurisdictionGuard, SegregationOfDutiesGuard],
})
export class AccessControlModule {}
