import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { ParcelsService } from './parcels.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Role, UserProfile } from '@sllas/contracts';
import {
  CreateParcelInput,
  UpdateParcelInput,
  VerifyParcelInput,
  BulkImportParcelsInput,
  ParcelSearchQuery,
  createParcelSchema,
  updateParcelSchema,
  verifyParcelSchema,
  bulkImportParcelsSchema,
} from '@sllas/validation';

@ApiTags('Land Registry — Parcels')
@ApiBearerAuth('bearer')
@ApiCookieAuth('sllas_session')
@Controller('api/v1/parcels')
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Post()
  @Roles(Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Register a new land parcel with boundary polygon' })
  @ApiResponse({ status: 201, description: 'Parcel successfully created in DRAFT status' })
  @ApiResponse({ status: 400, description: 'Invalid geometry or coordinate bounds' })
  @ApiResponse({ status: 409, description: 'Spatial overlap with an active parcel' })
  async create(
    @Body(new ZodValidationPipe(createParcelSchema)) dto: CreateParcelInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.parcelsService.create(dto, user);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Search and filter land parcels (public and staff)' })
  async search(
    @Query() query: ParcelSearchQuery,
    @CurrentUser() user?: UserProfile,
  ) {
    return this.parcelsService.search(query, user);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List all active land tenure categories' })
  async getCategories() {
    return this.parcelsService.getCategories();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get parcel details by ID' })
  async findById(@Param('id') id: string) {
    return this.parcelsService.findById(id);
  }

  @Put(':id')
  @Roles(Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update parcel details and boundary with optimistic locking' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateParcelSchema)) dto: UpdateParcelInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.parcelsService.update(id, dto, user);
  }

  @Post(':id/submit')
  @Roles(Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit parcel for formal review (DRAFT -> PENDING_VERIFICATION)' })
  async submitForVerification(
    @Param('id') id: string,
    @CurrentUser() user: UserProfile,
  ) {
    return this.parcelsService.submitForVerification(id, user);
  }

  @Post(':id/verify')
  @Roles(Role.REGISTRY_OFFICER, Role.APPROVER, Role.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify or return parcel for correction' })
  async verify(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(verifyParcelSchema)) dto: VerifyParcelInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.parcelsService.verify(id, dto, user);
  }

  @Post('bulk-import')
  @Roles(Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Bulk parcel import with dry-run preview and row-level diagnostics' })
  async bulkImport(
    @Body(new ZodValidationPipe(bulkImportParcelsSchema)) dto: BulkImportParcelsInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.parcelsService.bulkImport(dto, user);
  }
}
