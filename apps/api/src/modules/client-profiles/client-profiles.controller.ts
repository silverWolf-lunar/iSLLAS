import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, UserProfile } from '@sllas/contracts';
import {
  clientProfileSchema,
  ClientProfileInput,
  verifyClientProfileSchema,
  VerifyClientProfileInput,
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
