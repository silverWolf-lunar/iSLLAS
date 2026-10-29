import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserProfile } from '@sllas/contracts';
import { RunRecommendationInput } from '@sllas/validation';
import { RecommendationsService } from './recommendations.service';

@ApiTags('Recommendations')
@ApiBearerAuth('bearer')
@ApiCookieAuth('sllas_session')
@Controller('api/v1/recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('profiles')
  @Public()
  @ApiOperation({ summary: 'List available recommendation activity profiles' })
  async listProfiles() {
    return this.recommendationsService.listProfiles();
  }

  @Post('run')
  @ApiOperation({ summary: 'Run a recommendation engine pass for crop and land-use suitability' })
  async run(
    @Body() dto: RunRecommendationInput,
    @CurrentUser() user?: UserProfile,
  ) {
    return this.recommendationsService.runRecommendation(dto, user?.id);
  }

  @Get('parcel/:parcelId')
  @Public()
  @ApiOperation({ summary: 'Get a recommendation score for a single parcel' })
  async byParcel(@Param('parcelId') parcelId: string) {
    return this.recommendationsService.getRecommendationByParcel(parcelId);
  }
}
