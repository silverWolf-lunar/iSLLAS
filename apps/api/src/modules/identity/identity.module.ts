import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserIdentity } from './user-identity.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserIdentity])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, TypeOrmModule],
})
export class IdentityModule {}
