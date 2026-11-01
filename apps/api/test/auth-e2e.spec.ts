import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AuthController } from '../src/modules/identity/auth.controller';
import { AuthService } from '../src/modules/identity/auth.service';
import { User } from '../src/modules/identity/user.entity';
import { UserIdentity } from '../src/modules/identity/user-identity.entity';
import { AccessControlService } from '../src/modules/access-control/access-control.service';
import { HealthController } from '../src/modules/observability/health.controller';
import { MetricsController } from '../src/modules/observability/metrics.controller';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { ClientProfile } from '../src/modules/client-profiles/client-profile.entity';
import { AdminArea } from '../src/modules/organizations/admin-area.entity';
import { AuditService } from '../src/modules/audit/audit.service';
import { Role, UserStatus } from '@sllas/contracts';
import { SYSTEM_CONFIG } from '@sllas/config';

describe('Auth & Identity End-to-End API (/api/v1/auth)', () => {
  let app: INestApplication;
  let mockUserRepo: any;
  let mockIdentityRepo: any;
  let mockClientProfileRepo: any;
  let mockAdminAreaRepo: any;
  let mockAccessControlService: any;
  let mockAuditService: any;
  let mockDataSource: any;

  const testUser: Partial<User> = {
    id: '11111111-2222-3333-4444-555555555555',
    email: 'officer.harare@sllas.gov.zw',
    firstName: 'Tendai',
    lastName: 'Moyo',
    role: Role.REGISTRY_OFFICER,
    status: UserStatus.ACTIVE,
    provinceId: 'zw-ha',
    districtId: 'zw-ha-harare-urban',
  };

  beforeAll(async () => {
    mockUserRepo = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where?.id === testUser.id || where?.email === testUser.email) {
          return Promise.resolve(testUser);
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation((dto) => ({
        id: testUser.id,
        ...dto,
      })),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ id: testUser.id, ...entity }),
      ),
    };

    mockIdentityRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue({}),
    };

    mockClientProfileRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    mockAdminAreaRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'zw-ha', name: 'Harare' }),
    };

    mockAuditService = {
      record: jest.fn().mockResolvedValue({}),
      recordEvent: jest.fn().mockResolvedValue({}),
    };

    mockAccessControlService = {
      getRolePermissions: jest.fn().mockResolvedValue([
        'parcel:create',
        'parcel:read',
        'parcel:update',
        'parcel:verify',
      ]),
    };

    mockDataSource = {
      isInitialized: true,
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, HealthController, MetricsController],
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
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: AccessControlService,
          useValue: mockAccessControlService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Health & Observability Endpoints', () => {
    it('GET /health/live returns 200 UP', async () => {
      const res = await request(app.getHttpServer()).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });

    it('GET /health/ready returns 200 UP with database connected', async () => {
      const res = await request(app.getHttpServer()).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.database).toBe('CONNECTED');
    });

    it('GET /metrics returns prometheus formatted text', async () => {
      const res = await request(app.getHttpServer()).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('sllas_system_info');
    });
  });

  describe('Authentication Lifecycle', () => {
    let sessionToken: string;

    it('POST /api/v1/auth/dev-login generates a valid token and HTTP-only cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/dev-login')
        .send({
          email: testUser.email,
          role: Role.REGISTRY_OFFICER,
          provinceId: 'zw-ha',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.role).toBe(Role.REGISTRY_OFFICER);
      expect(response.body.user.permissions).toContain('parcel:create');

      sessionToken = response.body.token;

      // Verify cookie was set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieHeader = Array.isArray(cookies) ? cookies[0] : cookies;
      expect(cookieHeader).toContain(SYSTEM_CONFIG.AUTH.COOKIE_NAME);
      expect(cookieHeader).toContain('HttpOnly');
    });

    it('GET /api/v1/auth/me succeeds with Bearer token header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testUser.id);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.role).toBe(Role.REGISTRY_OFFICER);
      expect(response.body.permissions).toEqual(
        expect.arrayContaining(['parcel:create', 'parcel:verify']),
      );
    });

    it('GET /api/v1/auth/me succeeds with HTTP-only session cookie', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', [`${SYSTEM_CONFIG.AUTH.COOKIE_NAME}=${sessionToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testUser.id);
      expect(response.body.role).toBe(Role.REGISTRY_OFFICER);
    });

    it('GET /api/v1/auth/me fails with 401 when no token or cookie provided', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Authentication token missing');
    });

    it('GET /api/v1/auth/me fails with 401 when token is invalid or tampered', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-garbage-token');

      expect(response.status).toBe(401);
    });

    it('POST /api/v1/auth/logout clears session cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieHeader = Array.isArray(cookies) ? cookies[0] : cookies;
      expect(cookieHeader).toContain(`${SYSTEM_CONFIG.AUTH.COOKIE_NAME}=;`);
    });
  });
});
