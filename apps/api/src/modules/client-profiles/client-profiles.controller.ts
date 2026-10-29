import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, UserProfile, VerificationStatus } from '@sllas/contracts';
import {
  clientProfileSchema,
  ClientProfileInput,
  verifyClientProfileSchema,
  VerifyClientProfileInput,
  clientDocumentSchema,
  ClientDocumentInput,
} from '@sllas/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ClientProfilesService } from './client-profiles.service';

@ApiTags('Client Profiles')
@ApiBearerAuth('bearer')
@ApiCookieAuth('sllas_session')
@Controller('api/v1/client-profiles')
export class ClientProfilesController {
  constructor(private readonly profilesService: ClientProfilesService) {}

  @Get()
  @Roles(Role.REGISTRY_OFFICER, Role.ESTATES_OFFICER, Role.APPROVER, Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'List client applicant profiles for review queue' })
  listProfiles(
    @Query('status') status?: VerificationStatus,
    @Query('provinceId') provinceId?: string,
    @Query('districtId') districtId?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: UserProfile,
  ) {
    return this.profilesService.listProfiles({ status, provinceId, districtId, search }, user!);
  }

  @Get('me')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Get the authenticated client profile' })
  getOwnProfile(@CurrentUser() user: UserProfile) {
    return this.profilesService.getOwnProfile(user);
  }

  @Put('me')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Create or update the authenticated client profile' })
  upsertOwnProfile(
    @Body(new ZodValidationPipe(clientProfileSchema)) dto: ClientProfileInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.profilesService.upsertOwnProfile(dto, user);
  }

  @Post('me/documents')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Attach an uploaded KYC document to client profile' })
  attachDocument(
    @Body(new ZodValidationPipe(clientDocumentSchema)) dto: ClientDocumentInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.profilesService.attachDocument(dto, user);
  }

  @Get(':id')
  @Roles(Role.CLIENT, Role.REGISTRY_OFFICER, Role.ESTATES_OFFICER, Role.APPROVER, Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Get client profile detail and documents by ID' })
  getProfileById(@Param('id') id: string, @CurrentUser() user: UserProfile) {
    return this.profilesService.getProfileById(id, user);
  }

  @Post(':id/verification')
  @Roles(Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Verify or reject a client profile' })
  verifyProfile(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(verifyClientProfileSchema)) dto: VerifyClientProfileInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.profilesService.verifyProfile(id, dto, user);
  }
}

