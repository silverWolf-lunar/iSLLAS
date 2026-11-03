import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditAction, Role, UserProfile } from '@sllas/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Audit')
@Controller(['api/v1/audit-events', 'api/v1/audit'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.SYSTEM_ADMIN, Role.AUDITOR, Role.REGISTRY_OFFICER, Role.ESTATES_OFFICER)
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

  @Post('log')
  @Public()
  @ApiOperation({ summary: 'Record an audit log entry' })
  async createAuditLog(
    @Body() body: any,
    @CurrentUser() user?: UserProfile,
  ) {
    return this.auditService.logEvent({
      action: (body.action as AuditAction) || AuditAction.LOGIN,
      entityType: body.entityType || 'SYSTEM',
      entityId: body.entityId || 'SYS-01',
      actorId: user?.id,
      actorEmail: user?.email,
      actorRole: user?.role,
      metadata: body.metadata || body,
    });
  }
}
