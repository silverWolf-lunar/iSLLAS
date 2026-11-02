import { LeaseStatus, Role, UserProfile } from '@sllas/contracts';
import { LeasesService } from '../src/modules/leases/leases.service';

describe('LeasesService Status History & Tracking', () => {
  let service: LeasesService;
  let mockLeaseRepo: any;
  let mockParcelRepo: any;
  let mockHistoryRepo: any;
  let mockOutbox: any;
  let mockAudit: any;

  const adminUser: UserProfile = {
    id: 'user-admin-1',
    email: 'admin@lands.gov.zw',
    firstName: 'Admin',
    lastName: 'Officer',
    role: Role.SYSTEM_ADMIN,
    roles: [Role.SYSTEM_ADMIN],
    officeId: null,
    status: 'ACTIVE' as any,
    permissions: [],
  };

  beforeEach(() => {
    mockLeaseRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((lease) => Promise.resolve(lease)),
      createQueryBuilder: jest.fn(),
    };

    mockParcelRepo = {
      save: jest.fn().mockImplementation((p) => Promise.resolve(p)),
    };

    mockHistoryRepo = {
      find: jest.fn(),
      create: jest.fn().mockImplementation((data) => ({ id: 'hist-1', ...data, createdAt: new Date() })),
      save: jest.fn().mockImplementation((h) => Promise.resolve(h)),
    };

    mockOutbox = {
      enqueue: jest.fn().mockResolvedValue(undefined),
    };

    mockAudit = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    service = new LeasesService(
      mockLeaseRepo,
      mockParcelRepo,
      mockHistoryRepo,
      mockOutbox,
      mockAudit,
    );
  });

  it('records status transition in LeaseStatusHistory when status changes', async () => {
    const existingLease = {
      id: 'lease-1',
      leaseNumber: 'LS-2026-0001',
      status: LeaseStatus.ACTIVE,
      startDate: '2026-01-01',
      endDate: '2125-01-01',
      annualRent: 1200,
      currency: 'USD',
      createdAt: new Date(),
      parcel: { id: 'parcel-1', referenceNumber: 'PAR-1', areaHectares: 150 },
    };

    mockLeaseRepo.findOne.mockResolvedValue(existingLease);

    const result = await service.updateStatus(
      'lease-1',
      { status: LeaseStatus.EXPIRING_SOON, termsConditions: 'Audit review notice issued' },
      adminUser,
    );

    expect(mockHistoryRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        leaseId: 'lease-1',
        fromStatus: LeaseStatus.ACTIVE,
        toStatus: LeaseStatus.EXPIRING_SOON,
        actorId: 'user-admin-1',
        reason: 'Terms and status updated',
      }),
    );
    expect(mockHistoryRepo.save).toHaveBeenCalled();
    expect(result.status).toBe(LeaseStatus.EXPIRING_SOON);
  });

  it('retrieves chronological status history entries with getStatusHistory', async () => {
    const existingLease = {
      id: 'lease-1',
      leaseNumber: 'LS-2026-0001',
      status: LeaseStatus.EXPIRING_SOON,
    };
    mockLeaseRepo.findOne.mockResolvedValue(existingLease);

    const mockHistoryEntries = [
      {
        id: 'h-1',
        leaseId: 'lease-1',
        fromStatus: null,
        toStatus: LeaseStatus.ACTIVE,
        actorId: 'user-admin-1',
        actor: { firstName: 'Tendai', lastName: 'Moyo' },
        reason: 'Initial lease execution',
        comments: '99-year agricultural lease agreement',
        metadata: null,
        createdAt: new Date('2026-01-01T08:00:00Z'),
      },
      {
        id: 'h-2',
        leaseId: 'lease-1',
        fromStatus: LeaseStatus.ACTIVE,
        toStatus: LeaseStatus.EXPIRING_SOON,
        actorId: 'user-admin-1',
        actor: { firstName: 'Tendai', lastName: 'Moyo' },
        reason: 'Audit window notice',
        comments: '90-day renewal notification',
        metadata: null,
        createdAt: new Date('2026-06-01T10:00:00Z'),
      },
    ];
    mockHistoryRepo.find.mockResolvedValue(mockHistoryEntries);

    const history = await service.getStatusHistory('lease-1', adminUser);

    expect(history).toHaveLength(2);
    expect(history[0].toStatus).toBe(LeaseStatus.ACTIVE);
    expect(history[0].actorName).toBe('Tendai Moyo');
    expect(history[1].toStatus).toBe(LeaseStatus.EXPIRING_SOON);
  });
});
