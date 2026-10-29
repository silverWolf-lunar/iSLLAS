import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ApplicationsService } from '../src/modules/applications/applications.service';
import { ClientProfile } from '../src/modules/client-profiles/client-profile.entity';
import { LeaseApplication } from '../src/modules/applications/lease-application.entity';
import { ApplicationStatusHistory } from '../src/modules/applications/application-status-history.entity';
import { Lease } from '../src/modules/applications/lease.entity';
import { Parcel } from '../src/modules/parcels/parcel.entity';
import {
  ApplicationStatus,
  ParcelStatus,
  Role,
  UserProfile,
  VerificationStatus,
} from '@sllas/contracts';

describe('ApplicationsService allocation controls', () => {
  const client: UserProfile = {
    id: 'client-user-id', email: 'client@example.test', firstName: 'Tariro', lastName: 'Moyo',
    role: Role.CLIENT, roles: [Role.CLIENT], officeId: null, provinceId: null, districtId: null,
  };
  const reviewer: UserProfile = {
    id: 'reviewer-user-id', email: 'reviewer@example.test', firstName: 'Nyasha', lastName: 'Dube',
    role: Role.REGISTRY_OFFICER, roles: [Role.REGISTRY_OFFICER], officeId: 'office-id',
    provinceId: 'province-id', districtId: 'district-id',
  };
  const sameApprover: UserProfile = {
    ...reviewer, role: Role.APPROVER, roles: [Role.APPROVER],
  };

  let service: ApplicationsService;
  let profileRepo: any;
  let transactionApplicationRepo: any;
  let transactionParcelRepo: any;
  let manager: any;
  let outbox: any;
  let audit: any;

  beforeEach(() => {
    profileRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'profile-id', userId: client.id, verificationStatus: VerificationStatus.VERIFIED,
      } as ClientProfile),
    };
    transactionApplicationRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation(async entity => entity),
      create: jest.fn().mockImplementation(entity => entity),
    };
    transactionParcelRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation(async entity => entity),
      create: jest.fn().mockImplementation(entity => entity),
    };
    const transactionHistoryRepo = {
      create: jest.fn().mockImplementation(entity => entity),
      save: jest.fn().mockResolvedValue({ id: 'history-id' }),
    };
    const transactionLeaseRepo = {
      create: jest.fn().mockImplementation(entity => ({ id: 'lease-id', ...entity })),
      save: jest.fn().mockImplementation(async entity => entity),
    };
    manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === LeaseApplication) return transactionApplicationRepo;
        if (entity === Parcel) return transactionParcelRepo;
        if (entity === ApplicationStatusHistory) return transactionHistoryRepo;
        if (entity === Lease) return transactionLeaseRepo;
        return {};
      }),
    };
    const dataSource: any = { transaction: jest.fn(callback => callback(manager)) };
    outbox = { enqueue: jest.fn().mockResolvedValue({ id: 'event-id' }) };
    audit = { logEvent: jest.fn().mockResolvedValue({ id: 'audit-id' }) };
    const applicationRepo: any = {
      create: jest.fn().mockImplementation(entity => ({ id: 'application-id', ...entity })),
      save: jest.fn().mockImplementation(async entity => entity),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const historyRepo: any = { create: jest.fn().mockImplementation(entity => entity), save: jest.fn() };
    const leaseRepo: any = {};
    const parcelRepo: any = { findOne: jest.fn(), createQueryBuilder: jest.fn() };
    service = new ApplicationsService(
      applicationRepo,
      historyRepo,
      leaseRepo,
      profileRepo,
      parcelRepo,
      dataSource,
      outbox,
      audit,
    );
  });

  it('reserves an available parcel and records an application submission in one transaction', async () => {
    const application: Partial<LeaseApplication> = {
      id: 'application-id', applicationNumber: 'APP-2026-0001', clientProfileId: 'profile-id',
      parcelId: 'parcel-id', status: ApplicationStatus.DRAFT,
    };
    const parcel: Partial<Parcel> = {
      id: 'parcel-id', provinceId: 'province-id', districtId: 'district-id', status: ParcelStatus.AVAILABLE,
    };
    transactionApplicationRepo.findOne.mockResolvedValue(application);
    transactionParcelRepo.findOne.mockResolvedValue(parcel);

    const submitted = await service.submit('application-id', client);

    expect(submitted.status).toBe(ApplicationStatus.SUBMITTED);
    expect(parcel.status).toBe(ParcelStatus.RESERVED);
    expect(transactionApplicationRepo.save).toHaveBeenCalledWith(application);
    expect(transactionParcelRepo.save).toHaveBeenCalledWith(parcel);
    expect(outbox.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      entityManager: manager,
      aggregateId: 'application-id',
    }));
  });

  it('rejects a second submission when the parcel was already reserved', async () => {
    transactionApplicationRepo.findOne.mockResolvedValue({
      id: 'application-id', clientProfileId: 'profile-id', parcelId: 'parcel-id', status: ApplicationStatus.DRAFT,
    });
    transactionParcelRepo.findOne.mockResolvedValue({
      id: 'parcel-id', status: ParcelStatus.RESERVED,
    });

    await expect(service.submit('application-id', client)).rejects.toThrow(ConflictException);
    expect(transactionApplicationRepo.save).not.toHaveBeenCalled();
  });

  it('enforces segregation of duties before an approver can allocate a parcel', async () => {
    transactionApplicationRepo.findOne.mockResolvedValue({
      id: 'application-id', clientProfileId: 'profile-id', parcelId: 'parcel-id',
      status: ApplicationStatus.UNDER_REVIEW, assignedOfficerId: reviewer.id,
    });
    transactionParcelRepo.findOne.mockResolvedValue({
      id: 'parcel-id', provinceId: 'province-id', districtId: 'district-id', status: ParcelStatus.RESERVED,
    });

    await expect(service.approve('application-id', { comments: 'Recommended for approval.' }, sameApprover))
      .rejects.toThrow(ForbiddenException);
    expect(transactionParcelRepo.save).not.toHaveBeenCalled();
  });
});
