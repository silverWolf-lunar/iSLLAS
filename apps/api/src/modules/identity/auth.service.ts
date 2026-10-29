import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserIdentity } from './user-identity.entity';
import { AccessControlService } from '../access-control/access-control.service';
import { Role, UserProfile, UserStatus } from '@sllas/contracts';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private get jwtSecret(): string {
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production');
    }

    return 'dev-secret-key-for-local-testing-only-12345';
  }

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserIdentity)
    private readonly userIdentityRepo: Repository<UserIdentity>,
    private readonly accessControlService: AccessControlService,
  ) {}

  async getKeycloakProfile(subject: string): Promise<UserProfile> {
    const identity = await this.userIdentityRepo.findOne({
      where: { provider: 'keycloak', providerSubject: subject },
    });

    if (!identity) {
      throw new UnauthorizedException('Keycloak identity is not provisioned');
    }

    return this.getProfile(identity.userId);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    const permissions = await this.accessControlService.getRolePermissions(user.role);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: [user.role],
      role: user.role,
      phoneNumber: user.phoneNumber,
      officeId: user.officeId,
      provinceId: user.provinceId,
      districtId: user.districtId,
      status: user.status,
      permissions,
    };
  }

  /**
   * Generates a signed JWT token for a given user payload (used in development, testing, and mock auth)
   */
  generateToken(user: Partial<UserProfile>): string {
    return jwt.sign(
      {
        sub: user.id,
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || user.roles?.[0] || Role.CLIENT,
        roles: user.roles || (user.role ? [user.role] : [Role.CLIENT]),
        officeId: user.officeId || null,
        provinceId: user.provinceId || null,
        districtId: user.districtId || null,
        status: user.status || UserStatus.ACTIVE,
        permissions: user.permissions || [],
      },
      this.jwtSecret,
      { expiresIn: '1d' },
    );
  }

  /**
   * Fast dev login by role and province
   */
  async devLogin(role: Role, email?: string, provinceId?: string, districtId?: string): Promise<{ token: string; user: UserProfile }> {
    const isDevEnvironment = process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_LOGIN !== 'false';
    if (!isDevEnvironment) {
      throw new ForbiddenException('Development login is disabled in this environment');
    }

    let user = email ? await this.userRepo.findOne({ where: { email } }) : null;

    if (!user) {
      // Find or create synthetic user for testing
      const targetEmail = email || `${role.toLowerCase()}@sllas.gov.zw`;
      user = await this.userRepo.findOne({ where: { email: targetEmail } });

      if (!user) {
        user = this.userRepo.create({
          email: targetEmail,
          firstName: role.split('_')[0],
          lastName: role.split('_')[1] || 'User',
          role,
          status: UserStatus.ACTIVE,
          provinceId: provinceId || null,
          districtId: districtId || null,
        });
        user = await this.userRepo.save(user);
      }
    }

    const permissions = await this.accessControlService.getRolePermissions(user.role);

    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: [user.role],
      role: user.role,
      phoneNumber: user.phoneNumber,
      officeId: user.officeId,
      provinceId: user.provinceId,
      districtId: user.districtId,
      status: user.status,
      permissions,
    };

    const token = this.generateToken(profile);
    return { token, user: profile };
  }
}
