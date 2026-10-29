import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationStatus, Role, UserProfile } from '@sllas/contracts';
import {
  ApplicationRejectionInput,
  ApplicationReviewInput,
  applicationRejectionSchema,
  applicationReviewSchema,
  CreateApplicationInput,
  createApplicationSchema,
  SignLeaseAgreementInput,
  signLeaseAgreementSchema,
  AllocateParcelInput,
  allocateParcelSchema,
} from '@sllas/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApplicationsService } from './applications.service';

@ApiTags('Lease Applications')
@ApiBearerAuth('bearer')
@ApiCookieAuth('sllas_session')
@Controller('api/v1/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Create a lease application draft for an available parcel' })
  createDraft(
    @Body(new ZodValidationPipe(createApplicationSchema)) dto: CreateApplicationInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.applicationsService.createDraft(dto, user);
  }

  @Post('allocate')
  @Roles(Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Allocate an available parcel to a verified applicant' })
  allocate(
    @Body(new ZodValidationPipe(allocateParcelSchema)) dto: AllocateParcelInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.applicationsService.allocate(dto, user);
  }

  @Get('waiting-list')
  @Roles(Role.CLIENT, Role.REGISTRY_OFFICER, Role.APPROVER, Role.ESTATES_OFFICER, Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Get active applications in waiting list order' })
  getWaitingList(
    @Query('provinceId') provinceId?: string,
    @Query('districtId') districtId?: string,
    @Query('status') status?: ApplicationStatus,
    @Query('search') search?: string,
    @CurrentUser() user?: UserProfile,
  ) {
    return this.applicationsService.getWaitingList({ provinceId, districtId, status, search }, user!);
  }

  @Get()
  @Roles(Role.CLIENT, Role.REGISTRY_OFFICER, Role.APPROVER, Role.ESTATES_OFFICER, Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'List applications visible to the authenticated user' })
  list(@CurrentUser() user: UserProfile) {
    return this.applicationsService.list(user);
  }

  @Get('my')
  @Roles(Role.CLIENT, Role.REGISTRY_OFFICER, Role.APPROVER, Role.ESTATES_OFFICER, Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'List applications for the current authenticated user' })
  my(@CurrentUser() user: UserProfile) {
    return this.applicationsService.list(user);
  }

  @Post(':id/submit')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Submit an application and atomically reserve its parcel' })
  submit(@Param('id') id: string, @CurrentUser() user: UserProfile) {
    return this.applicationsService.submit(id, user);
  }

  @Post(':id/start-review')
  @Roles(Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Assign the current officer and begin application review' })
  startReview(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(applicationReviewSchema)) dto: ApplicationReviewInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.applicationsService.startReview(id, dto, user);
  }

  @Post(':id/request-information')
  @Roles(Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Request information from the client during review' })
  requestInformation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(applicationReviewSchema)) dto: ApplicationReviewInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.applicationsService.requestInformation(id, dto, user);
  }

  @Post(':id/provide-information')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Respond to an information request' })
  provideInformation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(applicationReviewSchema)) dto: ApplicationReviewInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.applicationsService.provideInformation(id, dto, user);
  }

  @Post(':id/approve')
  @Roles(Role.APPROVER)
  @ApiOperation({ summary: 'Approve an application and issue its offer' })
  approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(applicationReviewSchema)) dto: ApplicationReviewInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.applicationsService.approve(id, dto, user);
  }

  @Post(':id/reject')
  @Roles(Role.APPROVER)
  @ApiOperation({ summary: 'Reject an application and release its parcel' })
  reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(applicationRejectionSchema)) dto: ApplicationRejectionInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.applicationsService.reject(id, dto, user);
  }

  @Post(':id/withdraw')
  @Roles(Role.CLIENT, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Withdraw an eligible application and release its reservation' })
  withdraw(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(applicationRejectionSchema)) dto: ApplicationRejectionInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.applicationsService.withdraw(id, dto, user);
  }

  @Post(':id/accept-offer')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Accept an issued lease offer' })
  acceptOffer(@Param('id') id: string, @CurrentUser() user: UserProfile) {
    return this.applicationsService.acceptOffer(id, user);
  }

  @Post(':id/sign-agreement')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Create an active lease from an accepted agreement' })
  signAgreement(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(signLeaseAgreementSchema)) dto: SignLeaseAgreementInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.applicationsService.signAgreement(id, dto, user);
  }

  @Get(':id')
  @Roles(Role.CLIENT, Role.REGISTRY_OFFICER, Role.APPROVER, Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Get an application if it is within the caller access scope' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserProfile) {
    return this.applicationsService.findOne(id, user);
  }
}
