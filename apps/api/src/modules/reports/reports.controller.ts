import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardData, ExportRequest, JobStatusResponse, Role } from '@sllas/contracts';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('bearer')
@ApiCookieAuth('sllas_session')
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(Role.REGISTRY_OFFICER, Role.APPROVER, Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Get an operational dashboard summary for land registry staff' })
  async getDashboard(): Promise<DashboardData> {
    return this.reportsService.getDashboard();
  }

  @Post('export')
  @Roles(Role.REGISTRY_OFFICER, Role.APPROVER, Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Queue an operational report export' })
  async exportReport(@Body() request: ExportRequest): Promise<JobStatusResponse> {
    return this.reportsService.exportReport(request);
  }
}
