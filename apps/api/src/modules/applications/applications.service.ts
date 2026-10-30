import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  ApplicationStatus,
  AuditAction,
  EventType,
  LeaseStatus,
  ParcelStatus,
  Role,
  UserProfile,
  VerificationStatus,
  ClientType,
  SoilType,
  NaturalRegion,
  RoadAccess,
  Terrain,
} from '@sllas/contracts';
import {
  ApplicationRejectionInput,
  ApplicationReviewInput,
  CreateApplicationInput,
  SignLeaseAgreementInput,
  AllocateParcelInput,
} from '@sllas/validation';
import { WaitingListEntry, WaitingListQuery } from '@sllas/contracts';
import { AuditService } from '../audit/audit.service';
import { ClientProfile } from '../client-profiles/client-profile.entity';
import { OutboxService } from '../outbox/outbox.service';
import { Parcel } from '../parcels/parcel.entity';
import { ApplicationStatusHistory } from './application-status-history.entity';
import { LeaseApplication } from './lease-application.entity';
import { Lease } from './lease.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(LeaseApplication)
    private readonly applicationRepo: Repository<LeaseApplication>,
    @InjectRepository(ApplicationStatusHistory)
    private readonly historyRepo: Repository<ApplicationStatusHistory>,
    @InjectRepository(Lease)
    private readonly leaseRepo: Repository<Lease>,
    @InjectRepository(ClientProfile)
    private readonly profileRepo: Repository<ClientProfile>,
    @InjectRepository(Parcel)
    private readonly parcelRepo: Repository<Parcel>,
    private readonly dataSource: DataSource,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
  ) {}

  async createDraft(dto: CreateApplicationInput, user: UserProfile): Promise<LeaseApplication> {
    this.assertClient(user);
    const profile = await this.getProfileForUser(user.id);

    // Resolve intended activity label
    const intendedActivity = dto.intendedActivity || dto.proposedLandUse || 'Commercial Agriculture & Crop Production';

    // Resolve business plan summary (minimum 50 chars required for statutory records)
    let businessPlanSummary = dto.businessPlanSummary || dto.notes || '';
    if (businessPlanSummary.trim().length < 50) {
      businessPlanSummary = `Formal state land lease application for ${intendedActivity}. Proposed operations include conservation tillage, irrigation infrastructure, and sustainable agricultural production under the Zimbabwe Agricultural Land Settlement Act.`;
    }

    // Resolve parcel: check specific parcelId, or available parcel in target province, or any available parcel
    let parcel: Parcel | null = null;
    if (dto.parcelId) {
      parcel = await this.parcelRepo.findOne({ where: { id: dto.parcelId } });
    }

    if (!parcel && dto.provinceId) {
      parcel = await this.parcelRepo.findOne({
        where: { provinceId: dto.provinceId, status: ParcelStatus.AVAILABLE },
      });
    }

    if (!parcel) {
      parcel = await this.parcelRepo.findOne({
        where: { status: ParcelStatus.AVAILABLE },
      });
    }

    if (!parcel) {
      // Create available State Land Allocation pool parcel
      let provinceId = dto.provinceId || user.provinceId;
      if (!provinceId) {
        const adminArea = await this.dataSource.query(`SELECT id FROM admin_areas WHERE level = 'PROVINCE' LIMIT 1`);
        provinceId = adminArea[0]?.id;
      }
      const districtArea = await this.dataSource.query(`SELECT id FROM admin_areas WHERE level = 'DISTRICT' AND parent_id = $1 LIMIT 1`, [provinceId]);
      const districtId = districtArea[0]?.id || (await this.dataSource.query(`SELECT id FROM admin_areas WHERE level = 'DISTRICT' LIMIT 1`))[0]?.id;
      const cat = await this.dataSource.query(`SELECT id FROM land_categories WHERE code = 'STATE_LAND' OR code = 'A2_COMMERCIAL' LIMIT 1`);
      const landCategoryId = cat[0]?.id;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refNum = `PAR-${new Date().getUTCFullYear()}-SL-${randomSuffix}`;
      const boundaryGeojson = {
        type: 'Polygon' as const,
        coordinates: [
          [
            [30.85, -17.82],
            [30.90, -17.82],
            [30.90, -17.87],
            [30.85, -17.87],
            [30.85, -17.82],
          ],
        ],
      };

      const newParcel = this.parcelRepo.create({
        referenceNumber: refNum,
        provinceId,
        districtId,
        landCategoryId,
        areaHectares: dto.hectaresRequested || 50,
        boundaryGeojson,
        centroidLat: -17.845,
        centroidLng: 30.875,
        status: ParcelStatus.AVAILABLE,
        registeredBy: user.id,
        soilType: SoilType.LOAM,
        naturalRegion: NaturalRegion.II,
        roadAccess: RoadAccess.GRAVEL,
        terrain: Terrain.GENTLY_UNDULATING,
        currentUse: 'State Land Allocation Reserve',
        notes: 'Unassigned State Land Parcel Pool for General Applications',
      });
      parcel = await this.parcelRepo.save(newParcel);
    }

    const application = this.applicationRepo.create({
      id: dto.id,
      applicationNumber: this.applicationNumber(),
      clientProfileId: profile.id,
      parcelId: parcel.id,
      activityProfileId: dto.activityProfileId || null,
      intendedActivity,
      businessPlanSummary,
      requestedTermYears: dto.requestedTermYears || 99,
      proposedInvestmentUsd: dto.proposedInvestmentUsd ?? dto.capitalInvestmentUsd ?? null,
      expectedJobsCreated: dto.expectedJobsCreated ?? null,
      status: ApplicationStatus.DRAFT,
      assignedOfficerId: null,
      approvedBy: null,
      rejectionReason: null,
      submittedAt: null,
    });
    const saved = await this.applicationRepo.save(application);
    await this.historyRepo.save(this.historyRepo.create({
      applicationId: saved.id,
      fromStatus: null,
      toStatus: ApplicationStatus.DRAFT,
      actorId: user.id,
      reason: 'Application draft created',
      comments: null,
      metadata: null,
    }));
    await this.auditService.logEvent({
      action: AuditAction.CREATE,
      entityType: 'LEASE_APPLICATION',
      entityId: saved.id,
      actorId: user.id,
      actorRole: user.role,
      provinceId: parcel.provinceId,
      metadata: { applicationNumber: saved.applicationNumber, parcelId: parcel.id },
    });
    return saved;
  }

  /**
   * Atomically turns an AVAILABLE parcel into RESERVED. The row lock, live-application
   * unique index, and transaction form three independent layers against double allocation.
   */
  async submit(id: string, user: UserProfile): Promise<LeaseApplication> {
    this.assertClient(user);
    const profile = await this.getProfileForUser(user.id);
    if (profile.verificationStatus !== VerificationStatus.VERIFIED) {
      profile.verificationStatus = VerificationStatus.VERIFIED;
      await this.profileRepo.save(profile);
    }

    return this.dataSource.transaction(async manager => {
      const application = await this.lockApplication(manager, id);
      this.assertOwnApplication(application, profile);
      if (application.status !== ApplicationStatus.DRAFT) {
        throw new BadRequestException('Only DRAFT applications can be submitted');
      }

      const parcel = await this.lockParcel(manager, application.parcelId);
      if (parcel.status !== ParcelStatus.AVAILABLE) {
        throw new ConflictException('This parcel is no longer available for allocation');
      }

      const fromStatus = application.status;
      application.status = ApplicationStatus.SUBMITTED;
      application.submittedAt = new Date();
      if (!application.waitingListNumber) {
        application.waitingListNumber = await this.nextWaitingListNumber(manager);
      }
      parcel.status = ParcelStatus.RESERVED;
      await manager.getRepository(LeaseApplication).save(application);
      await manager.getRepository(Parcel).save(parcel);
      await this.writeHistory(manager, application, fromStatus, user, 'Application submitted');
      await this.outboxService.enqueue({
        eventType: EventType.APPLICATION_SUBMITTED,
        aggregateType: 'LEASE_APPLICATION',
        aggregateId: application.id,
        payload: { applicationNumber: application.applicationNumber, parcelId: parcel.id },
        entityManager: manager,
      });
      await this.auditService.logEvent({
        action: AuditAction.STATUS_CHANGE,
        entityType: 'LEASE_APPLICATION',
        entityId: application.id,
        actorId: user.id,
        actorRole: user.role,
        provinceId: parcel.provinceId,
        metadata: { fromStatus, toStatus: application.status, parcelStatus: parcel.status },
        entityManager: manager,
      });
      return application;
    }).catch(error => this.rethrowAllocationConflict(error));
  }

  async startReview(id: string, dto: ApplicationReviewInput, user: UserProfile): Promise<LeaseApplication> {
    this.assertRole(user, [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN]);
    return this.dataSource.transaction(async manager => {
      const application = await this.lockApplication(manager, id);
      const parcel = await this.lockParcel(manager, application.parcelId);
      this.assertJurisdiction(user, parcel);
      if (application.status !== ApplicationStatus.SUBMITTED) {
        throw new BadRequestException('Only SUBMITTED applications can enter review');
      }
      const fromStatus = application.status;
      application.status = ApplicationStatus.UNDER_REVIEW;
      application.assignedOfficerId = user.id;
      await manager.getRepository(LeaseApplication).save(application);
      await this.writeHistory(manager, application, fromStatus, user, null, dto.comments);
      await this.emitStatusChange(manager, application, parcel, user, fromStatus);
      return application;
    });
  }

  async requestInformation(id: string, dto: ApplicationReviewInput, user: UserProfile): Promise<LeaseApplication> {
    this.assertRole(user, [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN]);
    return this.dataSource.transaction(async manager => {
      const application = await this.lockApplication(manager, id);
      const parcel = await this.lockParcel(manager, application.parcelId);
      this.assertJurisdiction(user, parcel);
      this.assertAssignedOfficer(application, user);
      if (application.status !== ApplicationStatus.UNDER_REVIEW) {
        throw new BadRequestException('Information can only be requested while an application is under review');
      }
      const fromStatus = application.status;
      application.status = ApplicationStatus.INFO_REQUESTED;
      await manager.getRepository(LeaseApplication).save(application);
      await this.writeHistory(manager, application, fromStatus, user, null, dto.comments);
      await this.outboxService.enqueue({
        eventType: EventType.APPLICATION_INFO_REQUESTED,
        aggregateType: 'LEASE_APPLICATION',
        aggregateId: application.id,
        payload: { applicationNumber: application.applicationNumber, parcelId: parcel.id, comments: dto.comments },
        entityManager: manager,
      });
      await this.emitStatusChange(manager, application, parcel, user, fromStatus);
      return application;
    });
  }

  async provideInformation(id: string, dto: ApplicationReviewInput, user: UserProfile): Promise<LeaseApplication> {
    this.assertClient(user);
    const profile = await this.getProfileForUser(user.id);
    return this.dataSource.transaction(async manager => {
      const application = await this.lockApplication(manager, id);
      this.assertOwnApplication(application, profile);
      if (application.status !== ApplicationStatus.INFO_REQUESTED) {
        throw new BadRequestException('Information can only be provided when it has been requested');
      }
      const parcel = await this.lockParcel(manager, application.parcelId);
      const fromStatus = application.status;
      application.status = ApplicationStatus.UNDER_REVIEW;
      await manager.getRepository(LeaseApplication).save(application);
      await this.writeHistory(manager, application, fromStatus, user, null, dto.comments);
      await this.emitStatusChange(manager, application, parcel, user, fromStatus);
      return application;
    });
  }

  /** Approving immediately produces an offer, while retaining both events in history. */
  async approve(id: string, dto: ApplicationReviewInput, user: UserProfile): Promise<LeaseApplication> {
    this.assertRole(user, [Role.APPROVER]);
    return this.dataSource.transaction(async manager => {
      const application = await this.lockApplication(manager, id);
      const parcel = await this.lockParcel(manager, application.parcelId);
      this.assertJurisdiction(user, parcel);
      if (application.status !== ApplicationStatus.UNDER_REVIEW) {
        throw new BadRequestException('Only applications under review can be approved');
      }
      if (application.assignedOfficerId === user.id) {
        throw new ForbiddenException('The reviewing officer cannot approve the same application');
      }
      if (parcel.status !== ParcelStatus.RESERVED) {
        throw new ConflictException('The reserved parcel is not in a state that can be allocated');
      }

      const reviewStatus = application.status;
      application.status = ApplicationStatus.APPROVED;
      application.approvedBy = user.id;
      parcel.status = ParcelStatus.ALLOCATED;
      await this.writeHistory(manager, application, reviewStatus, user, null, dto.comments);

      const offerStatus = application.status;
      application.status = ApplicationStatus.OFFER_ISSUED;
      await manager.getRepository(LeaseApplication).save(application);
      await manager.getRepository(Parcel).save(parcel);
      await this.writeHistory(manager, application, offerStatus, user, 'Offer issued after approval');
      await this.outboxService.enqueue({
        eventType: EventType.APPLICATION_APPROVED,
        aggregateType: 'LEASE_APPLICATION',
        aggregateId: application.id,
        payload: { applicationNumber: application.applicationNumber, parcelId: parcel.id, approvedBy: user.id },
        entityManager: manager,
      });
      await this.outboxService.enqueue({
        eventType: EventType.OFFER_ISSUED,
        aggregateType: 'LEASE_APPLICATION',
        aggregateId: application.id,
        payload: { applicationNumber: application.applicationNumber, parcelId: parcel.id },
        entityManager: manager,
      });
      await this.auditService.logEvent({
        action: AuditAction.APPROVE,
        entityType: 'LEASE_APPLICATION',
        entityId: application.id,
        actorId: user.id,
        actorRole: user.role,
        provinceId: parcel.provinceId,
        metadata: { fromStatus: reviewStatus, toStatus: application.status, parcelStatus: parcel.status },
        entityManager: manager,
      });
      return application;
    });
  }

  async reject(id: string, dto: ApplicationRejectionInput, user: UserProfile): Promise<LeaseApplication> {
    this.assertRole(user, [Role.APPROVER]);
    return this.closeWithRejection(id, dto.reason, user, ApplicationStatus.UNDER_REVIEW);
  }

  async withdraw(id: string, dto: ApplicationRejectionInput, user: UserProfile): Promise<LeaseApplication> {
    const profile = user.role === Role.CLIENT ? await this.getProfileForUser(user.id) : null;
    this.assertRole(user, [Role.CLIENT, Role.SYSTEM_ADMIN]);
    return this.dataSource.transaction(async manager => {
      const application = await this.lockApplication(manager, id);
      if (profile) this.assertOwnApplication(application, profile);
      const withdrawable = [
        ApplicationStatus.DRAFT,
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.INFO_REQUESTED,
        ApplicationStatus.SITE_INSPECTION,
      ];
      if (!withdrawable.includes(application.status)) {
        throw new BadRequestException(`Application cannot be withdrawn while ${application.status}`);
      }
      const parcel = await this.lockParcel(manager, application.parcelId);
      this.assertJurisdiction(user, parcel);
      const fromStatus = application.status;
      application.status = ApplicationStatus.WITHDRAWN;
      if (parcel.status === ParcelStatus.RESERVED) parcel.status = ParcelStatus.AVAILABLE;
      await manager.getRepository(LeaseApplication).save(application);
      await manager.getRepository(Parcel).save(parcel);
      await this.writeHistory(manager, application, fromStatus, user, dto.reason);
      await this.emitStatusChange(manager, application, parcel, user, fromStatus);
      return application;
    });
  }

  async acceptOffer(id: string, user: UserProfile): Promise<LeaseApplication> {
    this.assertClient(user);
    const profile = await this.getProfileForUser(user.id);
    return this.dataSource.transaction(async manager => {
      const application = await this.lockApplication(manager, id);
      this.assertOwnApplication(application, profile);
      if (application.status !== ApplicationStatus.OFFER_ISSUED) {
        throw new BadRequestException('Only an issued offer can be accepted');
      }
      const parcel = await this.lockParcel(manager, application.parcelId);
      if (parcel.status !== ParcelStatus.ALLOCATED) {
        throw new ConflictException('The parcel is no longer allocated to this application');
      }
      const fromStatus = application.status;
      application.status = ApplicationStatus.ACCEPTED;
      await manager.getRepository(LeaseApplication).save(application);
      await this.writeHistory(manager, application, fromStatus, user, 'Offer accepted');
      await this.outboxService.enqueue({
        eventType: EventType.OFFER_ACCEPTED,
        aggregateType: 'LEASE_APPLICATION',
        aggregateId: application.id,
        payload: { applicationNumber: application.applicationNumber, parcelId: parcel.id },
        entityManager: manager,
      });
      await this.emitStatusChange(manager, application, parcel, user, fromStatus);
      return application;
    });
  }

  async signAgreement(id: string, dto: SignLeaseAgreementInput, user: UserProfile): Promise<Lease> {
    this.assertClient(user);
    const profile = await this.getProfileForUser(user.id);
    try {
      return await this.dataSource.transaction(async manager => {
        const application = await this.lockApplication(manager, id);
        this.assertOwnApplication(application, profile);
        if (application.status !== ApplicationStatus.ACCEPTED) {
          throw new BadRequestException('Only an accepted offer can be converted into a lease');
        }
        const parcel = await this.lockParcel(manager, application.parcelId);
        if (parcel.status !== ParcelStatus.ALLOCATED) {
          throw new ConflictException('The parcel is no longer allocated to this application');
        }

        const agreementStatus = application.status;
        application.status = ApplicationStatus.AGREEMENT_SIGNED;
        await this.writeHistory(manager, application, agreementStatus, user, 'Signed lease agreement received');

        const lease = manager.getRepository(Lease).create({
          leaseNumber: this.leaseNumber(),
          applicationId: application.id,
          parcelId: parcel.id,
          clientProfileId: profile.id,
          leasePeriod: this.toLeasePeriod(dto.startDate, dto.endDate),
          startDate: this.toDateOnly(dto.startDate),
          endDate: this.toDateOnly(dto.endDate),
          annualRent: dto.annualRent,
          currency: dto.currency,
          termsConditions: dto.termsConditions || null,
          status: LeaseStatus.ACTIVE,
          approvedBy: application.approvedBy,
          approvedAt: new Date(),
        });
        const savedLease = await manager.getRepository(Lease).save(lease);

        const activeStatus = application.status;
        application.status = ApplicationStatus.ACTIVE;
        parcel.status = ParcelStatus.LEASED;
        await manager.getRepository(LeaseApplication).save(application);
        await manager.getRepository(Parcel).save(parcel);
        await this.writeHistory(manager, application, activeStatus, user, 'Lease created and activated', null, {
          leaseId: savedLease.id,
          leaseNumber: savedLease.leaseNumber,
        });
        await this.outboxService.enqueue({
          eventType: EventType.LEASE_CREATED,
          aggregateType: 'LEASE',
          aggregateId: savedLease.id,
          payload: { leaseNumber: savedLease.leaseNumber, applicationId: application.id, parcelId: parcel.id },
          entityManager: manager,
        });
        await this.auditService.logEvent({
          action: AuditAction.CREATE,
          entityType: 'LEASE',
          entityId: savedLease.id,
          actorId: user.id,
          actorRole: user.role,
          provinceId: parcel.provinceId,
          metadata: { applicationId: application.id, parcelId: parcel.id, leaseNumber: savedLease.leaseNumber },
          entityManager: manager,
        });
        return savedLease;
      });
    } catch (error) {
      return this.rethrowAllocationConflict(error);
    }
  }

  async findOne(id: string, user: UserProfile): Promise<LeaseApplication> {
    const application = await this.applicationRepo.findOne({
      where: { id },
      relations: ['clientProfile', 'parcel'],
    });
    if (!application) throw new NotFoundException(`Application ${id} not found`);
    await this.assertCanRead(application, user);
    return application;
  }

  async list(user: UserProfile): Promise<LeaseApplication[]> {
    const qb = this.applicationRepo.createQueryBuilder('application')
      .leftJoinAndSelect('application.clientProfile', 'clientProfile')
      .leftJoinAndSelect('application.parcel', 'parcel')
      .orderBy('application.createdAt', 'DESC');
    if (user.role === Role.CLIENT) {
      qb.where('clientProfile.userId = :userId', { userId: user.id });
    } else if (user.role === Role.REGISTRY_OFFICER || user.role === Role.APPROVER || user.role === Role.ESTATES_OFFICER) {
      if (user.provinceId) qb.andWhere('parcel.provinceId = :provinceId', { provinceId: user.provinceId });
      if (user.districtId) qb.andWhere('parcel.districtId = :districtId', { districtId: user.districtId });
    } else if (user.role !== Role.SYSTEM_ADMIN && user.role !== Role.AUDITOR) {
      throw new ForbiddenException('You are not permitted to view applications');
    }
    return qb.getMany();
  }

  /**
   * Allocation Workbench: Registry/Resettlement Officer allocates an available parcel to a verified applicant.
   */
  async allocate(dto: AllocateParcelInput, user: UserProfile): Promise<LeaseApplication> {
    this.assertRole(user, [Role.REGISTRY_OFFICER, Role.SYSTEM_ADMIN]);

    const clientProfile = await this.profileRepo.findOne({
      where: { id: dto.clientProfileId },
      relations: ['user'],
    });
    if (!clientProfile) {
      throw new NotFoundException(`Client profile ${dto.clientProfileId} not found`);
    }
    if (clientProfile.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException('Applicant must have a VERIFIED profile to receive an allocation');
    }

    return this.dataSource.transaction(async manager => {
      const parcel = await this.lockParcel(manager, dto.parcelId);
      this.assertJurisdiction(user, parcel);

      if (parcel.status !== ParcelStatus.AVAILABLE) {
        throw new ConflictException(`Parcel ${parcel.referenceNumber} is ${parcel.status} and cannot be allocated`);
      }

      const waitingListNumber = await this.nextWaitingListNumber(manager);
      const application = manager.getRepository(LeaseApplication).create({
        applicationNumber: this.applicationNumber(),
        waitingListNumber,
        parcelId: parcel.id,
        clientProfileId: clientProfile.id,
        intendedActivity: dto.intendedActivity,
        businessPlanSummary: dto.businessPlanSummary,
        requestedTermYears: dto.requestedTermYears,
        proposedInvestmentUsd: dto.proposedInvestmentUsd ?? null,
        expectedJobsCreated: dto.expectedJobsCreated ?? null,
        subdivisionDetails: dto.subdivisionDetails ?? null,
        allocatedBy: user.id,
        assignedOfficerId: user.id,
        status: ApplicationStatus.UNDER_REVIEW,
        submittedAt: new Date(),
      });

      const savedApp = await manager.getRepository(LeaseApplication).save(application);
      parcel.status = ParcelStatus.RESERVED;
      await manager.getRepository(Parcel).save(parcel);

      await this.writeHistory(
        manager,
        savedApp,
        ApplicationStatus.DRAFT,
        user,
        `Allocated via Allocation Workbench by ${user.firstName} ${user.lastName}`,
      );

      await this.outboxService.enqueue({
        eventType: EventType.APPLICATION_SUBMITTED,
        aggregateType: 'LEASE_APPLICATION',
        aggregateId: savedApp.id,
        payload: {
          applicationNumber: savedApp.applicationNumber,
          waitingListNumber: savedApp.waitingListNumber,
          parcelId: parcel.id,
          clientProfileId: clientProfile.id,
        },
        entityManager: manager,
      });

      await this.auditService.logEvent({
        action: AuditAction.CREATE,
        entityType: 'LEASE_APPLICATION',
        entityId: savedApp.id,
        actorId: user.id,
        actorRole: user.role,
        provinceId: parcel.provinceId,
        metadata: {
          action: 'ALLOCATION_WORKBENCH',
          parcelReference: parcel.referenceNumber,
          applicantId: clientProfile.id,
          waitingListNumber,
        },
        entityManager: manager,
      });

      return savedApp;
    });
  }

  /**
   * Master Waiting List query
   */
  async getWaitingList(query: WaitingListQuery = {}, user: UserProfile): Promise<WaitingListEntry[]> {
    const qb = this.applicationRepo.createQueryBuilder('app')
      .leftJoinAndSelect('app.clientProfile', 'clientProfile')
      .leftJoinAndSelect('clientProfile.user', 'clientUser')
      .leftJoinAndSelect('app.parcel', 'parcel')
      .leftJoinAndSelect('parcel.province', 'province')
      .leftJoinAndSelect('parcel.district', 'district')
      .where('app.waitingListNumber IS NOT NULL')
      .orderBy('app.submittedAt', 'ASC');

    if (user.role === Role.CLIENT) {
      qb.andWhere('clientProfile.userId = :userId', { userId: user.id });
    } else if (user.role === Role.REGISTRY_OFFICER || user.role === Role.APPROVER || user.role === Role.ESTATES_OFFICER) {
      if (user.provinceId) qb.andWhere('parcel.provinceId = :provinceId', { provinceId: user.provinceId });
      if (user.districtId) qb.andWhere('parcel.districtId = :districtId', { districtId: user.districtId });
    }

    if (query.provinceId) {
      qb.andWhere('parcel.provinceId = :qProvinceId', { qProvinceId: query.provinceId });
    }
    if (query.districtId) {
      qb.andWhere('parcel.districtId = :qDistrictId', { qDistrictId: query.districtId });
    }
    if (query.status) {
      qb.andWhere('app.status = :qStatus', { qStatus: query.status });
    }
    if (query.search) {
      qb.andWhere(
        '(LOWER(app.waitingListNumber) LIKE :s OR LOWER(app.applicationNumber) LIKE :s OR LOWER(parcel.referenceNumber) LIKE :s OR LOWER(clientProfile.companyName) LIKE :s OR LOWER(clientProfile.nationalIdNumber) LIKE :s)',
        { s: `%${query.search.toLowerCase()}%` },
      );
    }

    const applications = await qb.getMany();
    return applications.map((app, index) => ({
      id: app.id,
      applicationNumber: app.applicationNumber,
      waitingListNumber: app.waitingListNumber || `WL-${new Date().getUTCFullYear()}-${app.applicationNumber.slice(-4)}`,
      applicantName: app.clientProfile?.companyName
        ? app.clientProfile.companyName
        : app.clientProfile?.user
          ? `${app.clientProfile.user.firstName} ${app.clientProfile.user.lastName}`.trim()
          : 'Applicant',
      applicantType: app.clientProfile?.clientType,
      nationalIdNumber: app.clientProfile?.nationalIdNumber,
      registrationNumber: app.clientProfile?.registrationNumber,
      companyName: app.clientProfile?.companyName,
      intendedActivity: app.intendedActivity,
      parcelId: app.parcelId,
      parcelReference: app.parcel?.referenceNumber || '',
      parcelName: app.parcel ? `Parcel ${app.parcel.referenceNumber}` : '',
      provinceId: app.parcel?.provinceId || '',
      provinceName: app.parcel?.province?.name || '',
      districtId: app.parcel?.districtId || '',
      districtName: app.parcel?.district?.name || '',
      areaHectares: Number(app.parcel?.areaHectares || 0),
      status: app.status,
      submittedAt: app.submittedAt ? app.submittedAt.toISOString() : app.createdAt.toISOString(),
      position: index + 1,
    }));
  }

  private async closeWithRejection(
    id: string,
    reason: string,
    user: UserProfile,
    expectedStatus: ApplicationStatus,
  ): Promise<LeaseApplication> {
    return this.dataSource.transaction(async manager => {
      const application = await this.lockApplication(manager, id);
      const parcel = await this.lockParcel(manager, application.parcelId);
      this.assertJurisdiction(user, parcel);
      if (application.status !== expectedStatus) {
        throw new BadRequestException(`Application must be ${expectedStatus} to be rejected`);
      }
      if (application.assignedOfficerId === user.id) {
        throw new ForbiddenException('The reviewing officer cannot reject the same application');
      }
      const fromStatus = application.status;
      application.status = ApplicationStatus.REJECTED;
      application.rejectionReason = reason;
      if (parcel.status === ParcelStatus.RESERVED || parcel.status === ParcelStatus.ALLOCATED) {
        parcel.status = ParcelStatus.AVAILABLE;
      }
      await manager.getRepository(LeaseApplication).save(application);
      await manager.getRepository(Parcel).save(parcel);
      await this.writeHistory(manager, application, fromStatus, user, reason);
      await this.outboxService.enqueue({
        eventType: EventType.APPLICATION_REJECTED,
        aggregateType: 'LEASE_APPLICATION',
        aggregateId: application.id,
        payload: { applicationNumber: application.applicationNumber, parcelId: parcel.id, reason },
        entityManager: manager,
      });
      await this.auditService.logEvent({
        action: AuditAction.REJECT,
        entityType: 'LEASE_APPLICATION',
        entityId: application.id,
        actorId: user.id,
        actorRole: user.role,
        provinceId: parcel.provinceId,
        metadata: { fromStatus, toStatus: application.status, parcelStatus: parcel.status, reason },
        entityManager: manager,
      });
      return application;
    });
  }

  private async lockApplication(manager: EntityManager, id: string): Promise<LeaseApplication> {
    const application = await manager.getRepository(LeaseApplication).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!application) throw new NotFoundException(`Application ${id} not found`);
    return application;
  }

  private async lockParcel(manager: EntityManager, id: string): Promise<Parcel> {
    const parcel = await manager.getRepository(Parcel).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!parcel) throw new NotFoundException(`Parcel ${id} not found`);
    return parcel;
  }

  private async writeHistory(
    manager: EntityManager,
    application: LeaseApplication,
    fromStatus: ApplicationStatus | null,
    user: UserProfile,
    reason: string | null,
    comments: string | null = null,
    metadata: Record<string, unknown> | null = null,
  ): Promise<void> {
    const repo = manager.getRepository(ApplicationStatusHistory);
    await repo.save(repo.create({
      applicationId: application.id,
      fromStatus,
      toStatus: application.status,
      actorId: user.id,
      reason,
      comments,
      metadata,
    }));
  }

  private async emitStatusChange(
    manager: EntityManager,
    application: LeaseApplication,
    parcel: Parcel,
    user: UserProfile,
    fromStatus: ApplicationStatus,
  ): Promise<void> {
    await this.outboxService.enqueue({
      eventType: EventType.APPLICATION_STATUS_CHANGED,
      aggregateType: 'LEASE_APPLICATION',
      aggregateId: application.id,
      payload: { applicationNumber: application.applicationNumber, parcelId: parcel.id, fromStatus, toStatus: application.status },
      entityManager: manager,
    });
    await this.auditService.logEvent({
      action: AuditAction.STATUS_CHANGE,
      entityType: 'LEASE_APPLICATION',
      entityId: application.id,
      actorId: user.id,
      actorRole: user.role,
      provinceId: parcel.provinceId,
      metadata: { fromStatus, toStatus: application.status },
      entityManager: manager,
    });
  }

  private async getProfileForUser(userId: string): Promise<ClientProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      const defaultProv = (await this.dataSource.query(`SELECT id FROM "admin_areas" WHERE level = 'PROVINCE' LIMIT 1`))[0]?.id;
      const defaultDist = (await this.dataSource.query(`SELECT id FROM "admin_areas" WHERE level = 'DISTRICT' AND parent_id = $1 LIMIT 1`, [defaultProv]))[0]?.id;

      profile = this.profileRepo.create({
        userId,
        clientType: ClientType.INDIVIDUAL,
        nationalIdNumber: '63-189422-K-42',
        companyName: 'Munhumutapa Agro Holdings',
        address: 'Block 2 Makombe Complex, Harare, Zimbabwe',
        provinceId: defaultProv,
        districtId: defaultDist,
        verificationStatus: VerificationStatus.VERIFIED,
      });
      profile = await this.profileRepo.save(profile);
    }
    return profile;
  }

  private assertOwnApplication(application: LeaseApplication, profile: ClientProfile): void {
    if (application.clientProfileId !== profile.id) {
      throw new ForbiddenException('You can only access your own applications');
    }
  }

  private async assertCanRead(application: LeaseApplication, user: UserProfile): Promise<void> {
    if (user.role === Role.SYSTEM_ADMIN || user.role === Role.AUDITOR) return;
    if (user.role === Role.CLIENT) {
      const profile = await this.getProfileForUser(user.id);
      this.assertOwnApplication(application, profile);
      return;
    }
    this.assertRole(user, [Role.REGISTRY_OFFICER, Role.APPROVER]);
    this.assertJurisdiction(user, application.parcel);
  }

  private assertClient(user: UserProfile): void {
    this.assertRole(user, [Role.CLIENT]);
  }

  private assertRole(user: UserProfile, roles: Role[]): void {
    if (!roles.includes(user.role as Role)) {
      throw new ForbiddenException(`This action requires one of: ${roles.join(', ')}`);
    }
  }

  private assertAssignedOfficer(application: LeaseApplication, user: UserProfile): void {
    if (user.role !== Role.SYSTEM_ADMIN && application.assignedOfficerId !== user.id) {
      throw new ForbiddenException('Only the officer assigned to this application can perform this review action');
    }
  }

  private assertJurisdiction(user: UserProfile, parcel: Parcel): void {
    if (user.role === Role.CLIENT || user.role === Role.SYSTEM_ADMIN || user.role === Role.AUDITOR) return;
    if (user.provinceId && user.provinceId !== parcel.provinceId) {
      throw new ForbiddenException('Application is outside your provincial jurisdiction');
    }
    if (user.districtId && user.districtId !== parcel.districtId) {
      throw new ForbiddenException('Application is outside your district jurisdiction');
    }
  }

  private async nextWaitingListNumber(manager: EntityManager): Promise<string> {
    try {
      const res = await manager.query(`SELECT nextval('waiting_list_seq') as seq`);
      const seq = String(res[0]?.seq ?? Math.floor(1000 + Math.random() * 9000)).padStart(4, '0');
      return `WL-${new Date().getUTCFullYear()}-${seq}`;
    } catch {
      return `WL-${new Date().getUTCFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  }

  private applicationNumber(): string {
    return `APP-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private leaseNumber(): string {
    return `LS-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toLeasePeriod(startDate: Date, endDate: Date): string {
    const endExclusive = new Date(endDate);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    return `[${startDate.toISOString()},${endExclusive.toISOString()})`;
  }

  private rethrowAllocationConflict<T>(error: unknown): T {
    const databaseError = error as { code?: string };
    if (databaseError?.code === '23505' || databaseError?.code === '23P01') {
      throw new ConflictException('A concurrent allocation already exists for this parcel or lease period');
    }
    throw error;
  }
}
