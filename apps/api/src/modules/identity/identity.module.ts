import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '../audit/audit.module';
import { User } from './user.entity';
import { UserIdentity } from './user-identity.entity';
import { ClientProfile } from '../client-profiles/client-profile.entity';
import { AdminArea } from '../organizations/admin-area.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserIdentity, ClientProfile, AdminArea]),
    AccessControlModule,
    AuditModule,
  ],
  controllers: [AuthController, UsersController],
  providers: [AuthService, UsersService],
  exports: [AuthService, UsersService, TypeOrmModule],
})
export class IdentityModule {}

