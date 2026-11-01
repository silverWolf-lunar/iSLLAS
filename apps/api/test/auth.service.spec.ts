import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/modules/identity/auth.service';
import { User } from '../src/modules/identity/user.entity';
import { UserIdentity } from '../src/modules/identity/user-identity.entity';
import { ClientProfile } from '../src/modules/client-profiles/client-profile.entity';
import { AdminArea } from '../src/modules/organizations/admin-area.entity';
import { AccessControlService } from '../src/modules/access-control/access-control.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { Role, UserStatus } from '@sllas/contracts';
import * as jwt from 'jsonwebtoken';

describe('AuthService (Authentication & Session Tokens)', () => {
  let service: AuthService;
  let mockUserRepo: any;
  let mockIdentityRepo: any;
  let mockClientProfileRepo: any;
  let mockAdminAreaRepo: any;
  let mockAccessControlService: any;
  let mockAuditService: any;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation(dto => dto),
      save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'usr-generated-id', ...entity })),
    };

    mockAccessControlService = {
      getRolePermissions: jest.fn().mockResolvedValue(['parcel:create', 'parcel:verify']),
    };
    mockIdentityRepo = {
      findOne: jest.fn(),
    };
    mockClientProfileRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(dto => dto),
      save: jest.fn().mockImplementation(entity => Promise.resolve(entity)),
    };
    mockAdminAreaRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'zw-ha', name: 'Harare' }),
    };
    mockAuditService = {
      record: jest.fn().mockResolvedValue({}),
      recordEvent: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(UserIdentity),
          useValue: mockIdentityRepo,
        },
        {
          provide: getRepositoryToken(ClientProfile),
          useValue: mockClientProfileRepo,
        },
        {
          provide: getRepositoryToken(AdminArea),
          useValue: mockAdminAreaRepo,
        },
        {
          provide: AccessControlService,
          useValue: mockAccessControlService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should generate a verifiable JWT containing user identity and role', () => {
    const token = service.generateToken({
      id: 'usr-123',
      email: 'officer@sllas.gov.zw',
      role: Role.REGISTRY_OFFICER,
      provinceId: 'prov-harare',
    });

    expect(token).toBeDefined();

    const decoded = jwt.decode(token) as any;
    expect(decoded.sub).toBe('usr-123');
    expect(decoded.email).toBe('officer@sllas.gov.zw');
    expect(decoded.role).toBe(Role.REGISTRY_OFFICER);
    expect(decoded.provinceId).toBe('prov-harare');
  });

  it('should return full profile with resolved permissions', async () => {
    mockUserRepo.findOne.mockResolvedValue({
      id: 'usr-123',
      email: 'officer@sllas.gov.zw',
      firstName: 'Tendai',
      lastName: 'Chikore',
      phoneNumber: '+263771234567',
      role: Role.REGISTRY_OFFICER,
      status: UserStatus.ACTIVE,
      officeId: 'off-1',
      provinceId: 'prov-harare',
      districtId: null,
    });

    const profile = await service.getProfile('usr-123');

    expect(profile.id).toBe('usr-123');
    expect(profile.email).toBe('officer@sllas.gov.zw');
    expect(profile.roles).toContain(Role.REGISTRY_OFFICER);
    expect(profile.permissions).toEqual(['parcel:create', 'parcel:verify']);
  });

  it('should reject an unprovisioned Keycloak identity with a clean unauthorized error', async () => {
    mockIdentityRepo.findOne.mockResolvedValue(null);

    await expect(service.getKeycloakProfile('unlinked-keycloak-subject'))
      .rejects.toThrow('Keycloak identity is not provisioned');
  });

  it('should reject tokens signed with a different secret', () => {
    const guard = new JwtAuthGuard(new Reflector());
    const forgedToken = jwt.sign({ sub: 'usr-123', email: 'attacker@example.com', role: Role.CLIENT }, 'wrong-secret');
    const context = {
      getHandler: () => ({}),
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: `Bearer ${forgedToken}` },
          cookies: {},
        }),
      }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should perform dev login and return token and profile', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousAllowDevLogin = process.env.ALLOW_DEV_LOGIN;
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOW_DEV_LOGIN;

    mockUserRepo.findOne.mockResolvedValue(null);

    const result = await service.devLogin(Role.APPROVER, 'approver@sllas.gov.zw', 'prov-harare');

    expect(result.token).toBeDefined();
    expect(result.user.role).toBe(Role.APPROVER);
    expect(result.user.provinceId).toBe('prov-harare');

    if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
    if (previousAllowDevLogin === undefined) delete process.env.ALLOW_DEV_LOGIN; else process.env.ALLOW_DEV_LOGIN = previousAllowDevLogin;
  });

  it('should reject development login in production', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousAllowDevLogin = process.env.ALLOW_DEV_LOGIN;
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_DEV_LOGIN;

    await expect(service.devLogin(Role.SYSTEM_ADMIN)).rejects.toThrow('Development login is disabled');

    if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
    if (previousAllowDevLogin === undefined) delete process.env.ALLOW_DEV_LOGIN; else process.env.ALLOW_DEV_LOGIN = previousAllowDevLogin;
  });
});
