import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

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
