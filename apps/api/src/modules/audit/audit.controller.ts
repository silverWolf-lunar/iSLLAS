import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@sllas/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Audit')
@Controller('api/v1/audit-events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Search append-only audit events log' })
  @SwaggerResponse({ status: 200, description: 'Audit events list' })
  async getAuditEvents(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string,
    @Query('provinceId') provinceId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.queryEvents({
      entityType,
      entityId,
      actorId,
      provinceId,
      limit: limit ? Number(limit) : 50,
    });
  }
}
