import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, UserProfile, UserStatus } from '@sllas/contracts';
import { CreateUserInput, createUserSchema, UpdateUserInput, updateUserSchema } from '@sllas/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@ApiCookieAuth('sllas_session')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'List all platform users' })
  list(
    @Query('role') role?: Role,
    @Query('status') status?: UserStatus,
    @Query('provinceId') provinceId?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.list({ role, status, provinceId, search });
  }

  @Get(':id')
  @Roles(Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Get user detail by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Provision a new staff user or operator' })
  create(
    @Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.usersService.create(dto, user);
  }

  @Patch(':id')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update user roles, jurisdictions, or status' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserInput,
    @CurrentUser() user: UserProfile,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete a user or remove staff identity' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: UserProfile,
  ) {
    return this.usersService.remove(id, user);
  }
}

