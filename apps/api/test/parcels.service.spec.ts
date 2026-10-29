import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ParcelsService } from '../src/modules/parcels/parcels.service';
import { Parcel } from '../src/modules/parcels/parcel.entity';
import { LandCategory } from '../src/modules/parcels/land-category.entity';
import { ParcelVerification } from '../src/modules/parcels/parcel-verification.entity';
import { AdminArea } from '../src/modules/organizations/admin-area.entity';
import { OutboxService } from '../src/modules/outbox/outbox.service';
import { AuditService } from '../src/modules/audit/audit.service';
import {
  ParcelStatus,
  Role,
  UserProfile,
  EventType,
  SoilType,
  NaturalRegion,
} from '@sllas/contracts';
import { ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ParcelsService (Land Registry Engine)', () => {
  let service: ParcelsService;
  let mockParcelRepo: any;
  let mockCategoryRepo: any;
  let mockVerificationRepo: any;
  let mockAdminAreaRepo: any;
  let mockOutboxService: any;
  let mockAuditService: any;

  const mashEastOfficer: UserProfile = {
    id: 'usr-officer-me-1',
    email: 'officer.goromonzi@sllas.gov.zw',
    firstName: 'Chipo',
    lastName: 'Mutasa',
    roles: [Role.REGISTRY_OFFICER],
    role: Role.REGISTRY_OFFICER,
    officeId: 'off-me-1',
    provinceId: 'prov-mash-east',
    districtId: 'dist-goromonzi',
  };

  const harareOfficer: UserProfile = {
    id: 'usr-officer-hre-1',
    email: 'officer.harare@sllas.gov.zw',
    firstName: 'Farai',
    lastName: 'Gumbo',
    roles: [Role.REGISTRY_OFFICER],
    role: Role.REGISTRY_OFFICER,
    officeId: 'off-hre-1',
    provinceId: 'prov-harare',
    districtId: 'dist-harare-urban',
  };

  const sampleBoundary: [number, number][][] = [
    [
      [31.350, -17.750],
      [31.360, -17.750],
      [31.360, -17.740],
      [31.350, -17.740],
      [31.350, -17.750],
    ],
  ];

  beforeEach(async () => {
    mockParcelRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'parcel-uuid-1', version: 1, ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: entity.id || 'parcel-uuid-1', ...entity })),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(41),
      createQueryBuilder: jest.fn(),
    };

    mockCategoryRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 'cat-state-land', name: 'State Land', code: 'STATE_LAND', isActive: true },
      ]),
    };

    mockVerificationRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockResolvedValue({ id: 'verif-uuid-1' }),
    };

    mockAdminAreaRepo = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where?.id === 'prov-mash-east') return Promise.resolve({ id: 'prov-mash-east', code: 'ZW-ME' });
        if (where?.id === 'dist-goromonzi') return Promise.resolve({ id: 'dist-goromonzi', code: 'GOROMONZI' });
        return Promise.resolve(null);
      }),
    };

    mockOutboxService = {
      enqueue: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };

    mockAuditService = {
      logEvent: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParcelsService,
        { provide: getRepositoryToken(Parcel), useValue: mockParcelRepo },
        { provide: getRepositoryToken(LandCategory), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(ParcelVerification), useValue: mockVerificationRepo },
        { provide: getRepositoryToken(AdminArea), useValue: mockAdminAreaRepo },
        { provide: OutboxService, useValue: mockOutboxService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get<ParcelsService>(ParcelsService);
  });

  describe('create', () => {
    it('should register a valid parcel, compute area, and enqueue outbox event', async () => {
      const result = await service.create(
        {
          provinceId: 'prov-mash-east',
          districtId: 'dist-goromonzi',
          landCategoryId: 'cat-state-land',
          boundary: { type: 'Polygon', coordinates: sampleBoundary },
          attributes: {
            naturalRegion: NaturalRegion.II,
            soilType: SoilType.LOAM,
          },
        },
        mashEastOfficer,
      );

      expect(mockParcelRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(ParcelStatus.DRAFT);
      expect(result.areaHectares).toBeGreaterThan(100);
      expect(result.referenceNumber).toContain('ZW-ME-GOR-');
      expect(mockOutboxService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.PARCEL_CREATED,
          aggregateType: 'PARCEL',
        }),
      );
      expect(mockAuditService.logEvent).toHaveBeenCalled();
    });

    it('should reject parcel creation outside the officer jurisdiction', async () => {
      await expect(
        service.create(
          {
            provinceId: 'prov-mash-east',
            districtId: 'dist-goromonzi',
            landCategoryId: 'cat-state-land',
            boundary: { type: 'Polygon', coordinates: sampleBoundary },
          },
          harareOfficer, // Assigned to Harare, attempting Mashonaland East
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject unclosed boundary polygon', async () => {
      const unclosed: [number, number][][] = [
        [
          [31.35, -17.75],
          [31.36, -17.75],
          [31.36, -17.74],
          [31.35, -17.74], // Not closed
        ],
      ];

      await expect(
        service.create(
          {
            provinceId: 'prov-mash-east',
            districtId: 'dist-goromonzi',
            landCategoryId: 'cat-state-land',
            boundary: { type: 'Polygon', coordinates: unclosed },
          },
          mashEastOfficer,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject parcel overlapping with an existing active parcel', async () => {
      // Mock existing active parcel overlapping sampleBoundary
      mockParcelRepo.find.mockResolvedValue([
        {
          id: 'existing-parcel-1',
          referenceNumber: 'ZW-ME-GOR-2026-0001',
          areaHectares: 120.5,
          districtId: 'dist-goromonzi',
          status: ParcelStatus.AVAILABLE,
          boundaryGeojson: {
            type: 'Polygon',
            coordinates: [
              [
                [31.355, -17.745],
                [31.365, -17.745],
                [31.365, -17.735],
                [31.355, -17.735],
                [31.355, -17.745],
              ],
            ],
          },
        },
      ]);

      await expect(
        service.create(
          {
            provinceId: 'prov-mash-east',
            districtId: 'dist-goromonzi',
            landCategoryId: 'cat-state-land',
            boundary: { type: 'Polygon', coordinates: sampleBoundary },
          },
          mashEastOfficer,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Verification Workflow', () => {
    it('should submit DRAFT parcel for verification', async () => {
      mockParcelRepo.findOne.mockResolvedValue({
        id: 'parcel-uuid-1',
        referenceNumber: 'ZW-ME-GOR-2026-0042',
        provinceId: 'prov-mash-east',
        districtId: 'dist-goromonzi',
        status: ParcelStatus.DRAFT,
      });

      const updated = await service.submitForVerification('parcel-uuid-1', mashEastOfficer);
      expect(updated.status).toBe(ParcelStatus.PENDING_VERIFICATION);
      expect(mockVerificationRepo.save).toHaveBeenCalled();
      expect(mockOutboxService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: EventType.PARCEL_STATUS_CHANGED }),
      );
    });

    it('should verify parcel and make it AVAILABLE', async () => {
      mockParcelRepo.findOne.mockResolvedValue({
        id: 'parcel-uuid-1',
        referenceNumber: 'ZW-ME-GOR-2026-0042',
        provinceId: 'prov-mash-east',
        districtId: 'dist-goromonzi',
        status: ParcelStatus.PENDING_VERIFICATION,
      });

      const updated = await service.verify(
        'parcel-uuid-1',
        {
          decision: 'VERIFY',
          notes: 'Boundary verified against satellite imagery and ground beacons',
          checklist: { beaconsVerified: true, accessConfirmed: true },
        },
        mashEastOfficer,
      );

      expect(updated.status).toBe(ParcelStatus.AVAILABLE);
      expect(updated.verifiedBy).toBe(mashEastOfficer.id);
      expect(updated.verifiedAt).toBeDefined();
      expect(mockOutboxService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: EventType.PARCEL_VERIFIED }),
      );
    });

    it('should return parcel for correction back to DRAFT', async () => {
      mockParcelRepo.findOne.mockResolvedValue({
        id: 'parcel-uuid-1',
        referenceNumber: 'ZW-ME-GOR-2026-0042',
        provinceId: 'prov-mash-east',
        districtId: 'dist-goromonzi',
        status: ParcelStatus.PENDING_VERIFICATION,
      });

      const updated = await service.verify(
        'parcel-uuid-1',
        {
          decision: 'RETURN_FOR_CORRECTION',
          notes: 'Western beacon coordinates do not match surveyor survey plan',
        },
        mashEastOfficer,
      );

      expect(updated.status).toBe(ParcelStatus.DRAFT);
      expect(updated.rejectionReason).toContain('Western beacon');
    });
  });

  describe('bulkImport', () => {
    it('dry-run mode should validate without persisting parcels', async () => {
      const result = await service.bulkImport(
        {
          dryRun: true,
          parcels: [
            {
              provinceId: 'prov-mash-east',
              districtId: 'dist-goromonzi',
              landCategoryId: 'cat-state-land',
              boundary: { type: 'Polygon', coordinates: sampleBoundary },
            },
          ],
        },
        mashEastOfficer,
      );

      expect(result.dryRun).toBe(true);
      expect(result.total).toBe(1);
      expect(result.validCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(mockParcelRepo.save).not.toHaveBeenCalled();
    });

    it('should preserve the original parcel index when attaching generated references', async () => {
      mockParcelRepo.find.mockResolvedValue([]);
      mockParcelRepo.save.mockImplementation(async (entity) => ({
        ...entity,
        id: entity.id || 'parcel-uuid-created',
        referenceNumber: `REF-${entity.provinceId}-${entity.districtId}`,
      }));

      const disjointBoundary: [number, number][][] = [
        [
          [31.450, -17.750],
          [31.460, -17.750],
          [31.460, -17.740],
          [31.450, -17.740],
          [31.450, -17.750],
        ],
      ];

      const result = await service.bulkImport(
        {
          dryRun: false,
          parcels: [
            {
              provinceId: 'prov-mash-east',
              districtId: 'dist-goromonzi',
              landCategoryId: 'cat-state-land',
              boundary: { type: 'Polygon', coordinates: sampleBoundary },
            },
            {
              provinceId: 'prov-mash-east',
              districtId: 'dist-goromonzi',
              landCategoryId: 'cat-state-land',
              boundary: { type: 'Polygon', coordinates: sampleBoundary },
            },
            {
              provinceId: 'prov-mash-east',
              districtId: 'dist-goromonzi',
              landCategoryId: 'cat-state-land',
              boundary: { type: 'Polygon', coordinates: disjointBoundary },
            },
          ],
        },
        mashEastOfficer,
      );

      expect(result.results[0]).toMatchObject({ index: 0, success: true, referenceNumber: expect.any(String) });
      expect(result.results[1]).toMatchObject({ index: 1, success: false, error: expect.stringContaining('overlaps') });
      expect(result.results[2]).toMatchObject({ index: 2, success: true, referenceNumber: expect.any(String) });
      expect(result.validCount).toBe(2);
      expect(result.results[1].referenceNumber).toBeUndefined();
    });
  });
});
