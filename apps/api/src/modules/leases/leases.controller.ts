import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaseStatus, Role, UserProfile } from '@sllas/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { LeasesService } from './leases.service';

@ApiTags('Leases')
@ApiBearerAuth('bearer')
@ApiCookieAuth('sllas_session')
@Controller('api/v1/leases')
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Get()
  @Roles(Role.CLIENT, Role.REGISTRY_OFFICER, Role.APPROVER, Role.ESTATES_OFFICER, Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'List active and historical leases within caller jurisdiction' })
  list(
    @Query('status') status?: LeaseStatus,
    @Query('search') search?: string,
    @CurrentUser() user?: UserProfile,
  ) {
    return this.leasesService.list(user!, { status, search });
  }

  @Get(':id')
  @Roles(Role.CLIENT, Role.REGISTRY_OFFICER, Role.APPROVER, Role.ESTATES_OFFICER, Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Get lease agreement detail by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserProfile) {
    return this.leasesService.findOne(id, user);
  }

  @Get(':id/print')
  @Roles(Role.CLIENT, Role.REGISTRY_OFFICER, Role.APPROVER, Role.ESTATES_OFFICER, Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Get official print-ready legal lease agreement for Republic of Zimbabwe' })
  getPrintDocument(@Param('id') id: string, @CurrentUser() user: UserProfile) {
    return this.leasesService.getPrintDocument(id, user);
  }
}
