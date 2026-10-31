import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserIdentity } from './user-identity.entity';
import { ClientProfile } from '../client-profiles/client-profile.entity';
import { AdminArea } from '../organizations/admin-area.entity';
import { AccessControlService } from '../access-control/access-control.service';
import { AuditService } from '../audit/audit.service';
import { Role, UserProfile, UserStatus, ClientType, VerificationStatus, AuditAction, AdminAreaLevel } from '@sllas/contracts';
import { ClientRegisterInput } from '@sllas/validation';
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
    @InjectRepository(ClientProfile)
    private readonly clientProfileRepo: Repository<ClientProfile>,
    @InjectRepository(AdminArea)
    private readonly adminAreaRepo: Repository<AdminArea>,
    private readonly accessControlService: AccessControlService,
    private readonly auditService: AuditService,
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

  /**
   * Stage 0: Citizen / Client self-registration
   * Enforces Role.CLIENT, checks duplicate email and national ID, creates user,
   * linked identity, client profile, and logs the statutory audit trail.
   */
  async register(dto: ClientRegisterInput): Promise<{ token: string; user: UserProfile }> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.userRepo.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictException(`An account with email '${dto.email}' is already registered.`);
    }

    if (dto.nationalIdNumber && dto.nationalIdNumber.trim().length > 0) {
      const existingProfile = await this.clientProfileRepo.findOne({
        where: { nationalIdNumber: dto.nationalIdNumber.trim() },
      });
      if (existingProfile) {
        throw new ConflictException(`A citizen profile with National ID '${dto.nationalIdNumber}' is already registered.`);
      }
    }

    // Resolve or fallback to valid administrative province and district
    let targetProvinceId = dto.provinceId || null;
    let targetDistrictId = dto.districtId || null;

    if (!targetProvinceId) {
      const defaultProv = await this.adminAreaRepo.findOne({
        where: { level: AdminAreaLevel.PROVINCE },
        order: { name: 'ASC' },
      });
      targetProvinceId = defaultProv ? defaultProv.id : null;
    }

    if (!targetDistrictId && targetProvinceId) {
      const defaultDist = await this.adminAreaRepo.findOne({
        where: { level: AdminAreaLevel.DISTRICT, parentId: targetProvinceId },
      });
      targetDistrictId = defaultDist ? defaultDist.id : null;
    }

    // Save citizen user record (always Role.CLIENT)
    const user = this.userRepo.create({
      email: normalizedEmail,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phoneNumber: dto.phoneNumber?.trim() || null,
      role: Role.CLIENT,
      status: UserStatus.ACTIVE,
      provinceId: targetProvinceId,
      districtId: targetDistrictId,
    });
    const savedUser = await this.userRepo.save(user);

    // Link keycloak/local identity
    const identity = this.userIdentityRepo.create({
      userId: savedUser.id,
      provider: 'keycloak',
      providerSubject: `sub-${savedUser.id}`,
    });
    await this.userIdentityRepo.save(identity);

    // Create initial statutory client profile record if province and district exist
    if (targetProvinceId && targetDistrictId) {
      const clientProfile = this.clientProfileRepo.create({
        userId: savedUser.id,
        clientType: dto.clientType || ClientType.INDIVIDUAL,
        nationalIdNumber: dto.nationalIdNumber?.trim() || null,
        companyName: dto.companyName?.trim() || null,
        registrationNumber: dto.registrationNumber?.trim() || null,
        address: dto.address?.trim() || 'Pending address verification',
        provinceId: targetProvinceId,
        districtId: targetDistrictId,
        verificationStatus: VerificationStatus.UNVERIFIED,
      });
      await this.clientProfileRepo.save(clientProfile);
    }

    // Write Stage 0 statutory audit log
    await this.auditService.logEvent({
      action: AuditAction.CREATE,
      entityType: 'USER',
      entityId: savedUser.id,
      actorId: savedUser.id,
      actorEmail: savedUser.email,
      actorRole: Role.CLIENT,
      provinceId: targetProvinceId,
      metadata: {
        registrationType: 'CITIZEN_SELF_REGISTRATION',
        clientType: dto.clientType,
        nationalIdNumber: dto.nationalIdNumber,
        statutoryAct: 'Agricultural Land Settlement Act [Chapter 20:01]',
      },
    });

    const permissions = await this.accessControlService.getRolePermissions(savedUser.role);

    const profile: UserProfile = {
      id: savedUser.id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      roles: [savedUser.role],
      role: savedUser.role,
      phoneNumber: savedUser.phoneNumber,
      officeId: savedUser.officeId,
      provinceId: savedUser.provinceId,
      districtId: savedUser.districtId,
      status: savedUser.status,
      permissions,
    };

    const token = this.generateToken(profile);
    return { token, user: profile };
  }
}
