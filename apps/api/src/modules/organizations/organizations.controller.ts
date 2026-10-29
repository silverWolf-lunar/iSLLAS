import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { Role } from '@sllas/contracts';
import { CreateOfficeInput, createOfficeSchema, UpdateOfficeInput, updateOfficeSchema } from '@sllas/validation';
import { OrganizationsService } from './organizations.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Organizations')
@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Get('offices')
  @ApiOperation({ summary: 'List all government registry offices' })
  async getOffices() {
    return this.orgService.listOffices();
  }

  @Get('offices/:id')
  @ApiOperation({ summary: 'Get details of a government registry office' })
  async getOfficeById(@Param('id') id: string) {
    return this.orgService.getOfficeById(id);
  }

  @Post('offices')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create a new registry office' })
  async createOffice(@Body(new ZodValidationPipe(createOfficeSchema)) dto: CreateOfficeInput) {
    return this.orgService.createOffice(dto);
  }

  @Patch('offices/:id')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update an existing registry office' })
  async updateOffice(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOfficeSchema)) dto: UpdateOfficeInput,
  ) {
    return this.orgService.updateOffice(id, dto);
  }

  @Get('provinces')
  @Public()
  @ApiOperation({ summary: 'List Zimbabwe provinces (public reference)' })
  async getProvinces() {
    return this.orgService.listProvinces();
  }

  @Get('districts')
  @Public()
  @ApiOperation({ summary: 'List districts by province' })
  async getDistricts(@Query('provinceId') provinceId?: string) {
    return this.orgService.listDistricts(provinceId);
  }
}
