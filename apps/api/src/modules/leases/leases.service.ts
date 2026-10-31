import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, EventType, LeaseStatus, ParcelStatus, Role, UserProfile, LeaseDetail, LeaseLegalDocument } from '@sllas/contracts';
import { Lease } from '../applications/lease.entity';
import { Parcel } from '../parcels/parcel.entity';
import { OutboxService } from '../outbox/outbox.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LeasesService {
  constructor(
    @InjectRepository(Lease)
    private readonly leaseRepo: Repository<Lease>,
    @InjectRepository(Parcel)
    private readonly parcelRepo: Repository<Parcel>,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
  ) {}

  async list(user: UserProfile, filters: { status?: LeaseStatus; search?: string } = {}): Promise<LeaseDetail[]> {
    const qb = this.leaseRepo.createQueryBuilder('lease')
      .leftJoinAndSelect('lease.application', 'application')
      .leftJoinAndSelect('lease.parcel', 'parcel')
      .leftJoinAndSelect('parcel.province', 'province')
      .leftJoinAndSelect('parcel.district', 'district')
      .leftJoinAndSelect('lease.clientProfile', 'clientProfile')
      .leftJoinAndSelect('clientProfile.user', 'clientUser')
      .orderBy('lease.createdAt', 'DESC');

    if (user.role === Role.CLIENT) {
      qb.where('clientProfile.userId = :userId', { userId: user.id });
    } else if (
      user.role === Role.REGISTRY_OFFICER ||
      user.role === Role.APPROVER ||
      user.role === Role.ESTATES_OFFICER
    ) {
      if (user.provinceId) qb.andWhere('parcel.provinceId = :provinceId', { provinceId: user.provinceId });
      if (user.districtId) qb.andWhere('parcel.districtId = :districtId', { districtId: user.districtId });
    } else if (user.role !== Role.SYSTEM_ADMIN && user.role !== Role.AUDITOR) {
      throw new ForbiddenException('You are not permitted to view leases');
    }

    if (filters.status) {
      qb.andWhere('lease.status = :status', { status: filters.status });
    }
    if (filters.search) {
      qb.andWhere(
        '(LOWER(lease.leaseNumber) LIKE :s OR LOWER(parcel.name) LIKE :s OR LOWER(parcel.referenceNumber) LIKE :s OR LOWER(clientProfile.companyName) LIKE :s)',
        { s: `%${filters.search.toLowerCase()}%` },
      );
    }

    const items = await qb.getMany();
    return items.map(l => this.toDetail(l));
  }

  async findOne(id: string, user: UserProfile): Promise<LeaseDetail> {
    const lease = await this.leaseRepo.findOne({
      where: { id },
      relations: [
        'application',
        'parcel',
        'parcel.province',
        'parcel.district',
        'clientProfile',
        'clientProfile.user',
      ],
    });

    if (!lease) {
      throw new NotFoundException(`Lease ${id} not found`);
    }

    this.assertCanAccess(lease, user);
    return this.toDetail(lease);
  }

  async getPrintDocument(id: string, user: UserProfile): Promise<LeaseLegalDocument> {
    const detail = await this.findOne(id, user);

    const clientName = detail.client?.companyName
      ? detail.client.companyName
      : detail.client?.name || 'Lessee';

    const idNumber = detail.client?.registrationNumber
      ? `Registration No: ${detail.client.registrationNumber}`
      : `National ID: ${detail.client?.nationalIdNumber || 'N/A'}`;

    const startDate = new Date(detail.startDate);
    const endDate = new Date(detail.endDate);
    const termYears = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));

    return {
      leaseNumber: detail.leaseNumber,
      title: 'STATE LAND LEASE AND ALLOCATION AGREEMENT',
      jurisdiction: `${detail.parcel?.district ?? 'District'}, ${detail.parcel?.province ?? 'Province'}, Republic of Zimbabwe`,
      republicHeader: 'GOVERNMENT OF THE REPUBLIC OF ZIMBABWE\nMINISTRY OF LANDS & RURAL DEVELOPMENT',
      lessor: 'The President of the Republic of Zimbabwe, represented by the Minister of Lands & Rural Development',
      lessee: {
        name: clientName,
        type: detail.client?.clientType || 'INDIVIDUAL',
        idNumber,
        address: detail.client?.address || 'Harare, Zimbabwe',
      },
      property: {
        reference: detail.parcel?.referenceNumber || 'REF-N/A',
        name: `Parcel ${detail.parcel?.referenceNumber || 'Cadastral Parcel'}`,
        province: detail.parcel?.province || 'Zimbabwe',
        district: detail.parcel?.district || 'District',
        sizeHectares: detail.parcel?.areaHectares || 0,
        boundariesDescription: `Cadastral Reference ${detail.parcel?.referenceNumber || 'SURV/NAT-CAD/2026'} - Natural Region ${detail.parcel?.naturalRegion || 'II'} - Soil Classification: ${detail.parcel?.soilType || 'LOAM'}`,
      },
      term: {
        startDate: detail.startDate,
        endDate: detail.endDate,
        years: termYears,
      },
      financial: {
        annualRent: detail.annualRent,
        currency: detail.currency,
        dueDay: '31st January annually',
      },
      statutoryClauses: [
        '1. PURPOSE AND USE: The Lessee shall use the land strictly for agricultural, horticultural, or approved agro-industrial operations in compliance with the Land Commission Act [Chapter 20:29]. Sub-leasing or subdivision without prior written consent from the Minister is strictly prohibited.',
        '2. GOOD HUSBANDRY & SOIL CONSERVATION: The Lessee covenants to implement approved soil and water conservation practices, avoid deforestation, maintain contour ridges, and prevent unauthorized land degradation.',
        '3. RENTAL AND LEVY OBLIGATIONS: The Lessee shall pay the annual lease rental as specified, subject to statutory review every three (3) years. Default in payment exceeding ninety (90) days shall entitle the Lessor to cancel the lease without prejudice to recovery of arrears.',
        '4. RIGHT OF INSPECTION: Authorized officers of the Ministry and Estates Department shall have unrestricted right of entry at reasonable times to inspect boundaries, infrastructure, and agricultural activity.',
        '5. TERMINATION AND EXPIRY: The lease shall determine upon expiry of the stated term, or earlier if cancelled for breach of conditions, material non-utilization, or abandonment after sixty (60) days statutory notice.',
        '6. DISPUTE RESOLUTION: Any dispute arising out of or in connection with this agreement shall be referred to the Zimbabwe Land Commission for determination pursuant to Section 297 of the Constitution of Zimbabwe.',
      ],
      signatories: {
        lessorTitle: 'For and on behalf of the Minister of Lands & Rural Development',
        lessorRepresentative: 'Chief Land Registrar / Secretary for Lands',
        lesseeRepresentative: clientName,
        witnessOne: 'Registry Officer / District Land Officer',
        witnessTwo: 'Estates & Cadastre Surveyor',
      },
    };
  }

  private assertCanAccess(lease: Lease, user: UserProfile): void {
    if (user.role === Role.SYSTEM_ADMIN || user.role === Role.AUDITOR) return;
    if (user.role === Role.CLIENT) {
      if (lease.clientProfile?.userId !== user.id) {
        throw new ForbiddenException('You do not have permission to view this lease');
      }
      return;
    }
    if (user.provinceId && lease.parcel?.provinceId && user.provinceId !== lease.parcel.provinceId) {
      throw new ForbiddenException('Lease parcel is outside your provincial jurisdiction');
    }
    if (user.districtId && lease.parcel?.districtId && user.districtId !== lease.parcel.districtId) {
      throw new ForbiddenException('Lease parcel is outside your district jurisdiction');
    }
  }

  private toDetail(l: Lease): LeaseDetail {
    const clientName = l.clientProfile?.companyName
      ? l.clientProfile.companyName
      : l.clientProfile?.user
        ? `${l.clientProfile.user.firstName} ${l.clientProfile.user.lastName}`.trim()
        : 'Client';

    return {
      id: l.id,
      leaseNumber: l.leaseNumber,
      applicationId: l.applicationId,
      parcelId: l.parcelId,
      parcelReference: l.parcel?.referenceNumber || '',
      clientProfileId: l.clientProfileId,
      clientName,
      startDate: l.startDate,
      endDate: l.endDate,
      annualRent: Number(l.annualRent),
      currency: l.currency,
      termsConditions: l.termsConditions,
      status: l.status,
      approvedBy: l.approvedBy,
      approvedAt: l.approvedAt ? l.approvedAt.toISOString() : null,
      createdAt: l.createdAt.toISOString(),
      documents: [],
      renewals: [],
      parcel: l.parcel ? {
        id: l.parcel.id,
        referenceNumber: l.parcel.referenceNumber,
        areaHectares: Number(l.parcel.areaHectares),
        province: l.parcel.province?.name || '',
        district: l.parcel.district?.name || '',
        ward: l.parcel.wardId,
        soilType: l.parcel.soilType,
        naturalRegion: l.parcel.naturalRegion,
      } : undefined,
      client: l.clientProfile ? {
        id: l.clientProfile.id,
        name: clientName,
        clientType: l.clientProfile.clientType,
        nationalIdNumber: l.clientProfile.nationalIdNumber,
        companyName: l.clientProfile.companyName,
        registrationNumber: l.clientProfile.registrationNumber,
        address: l.clientProfile.address,
        email: l.clientProfile.user?.email,
        phone: l.clientProfile.user?.phoneNumber || undefined,
      } : undefined,
    };
  }

  /**
   * Public read-only verification of a lease deed via QR code (non-PII)
   */
  async verifyLease(referenceOrId: string) {
    const lease = await this.leaseRepo.findOne({
      where: [{ id: referenceOrId }, { leaseNumber: referenceOrId }],
      relations: [
        'parcel',
        'parcel.province',
        'parcel.district',
        'clientProfile',
        'clientProfile.user',
      ],
    });

    if (!lease) {
      throw new NotFoundException(`Lease with reference or ID '${referenceOrId}' was not found on the National Land Register.`);
    }

    const clientName = lease.clientProfile?.companyName
      ? lease.clientProfile.companyName
      : lease.clientProfile?.user
        ? `${lease.clientProfile.user.firstName} ${lease.clientProfile.user.lastName}`.trim()
        : 'Registered Citizen / Lessee';

    const now = new Date();
    const endDate = new Date(lease.endDate);
    const isExpired = now > endDate;
    const isCancelled = lease.status === LeaseStatus.TERMINATED;
    const isActive = lease.status === LeaseStatus.ACTIVE && !isExpired;

    return {
      leaseNumber: lease.leaseNumber,
      parcelReference: lease.parcel?.referenceNumber || 'Cadastral Parcel',
      lesseeName: clientName,
      startDate: lease.startDate,
      endDate: lease.endDate,
      currentStatus: isCancelled ? 'CANCELLED' : isExpired ? 'EXPIRED' : lease.status,
      termYears: Math.max(1, Math.round((endDate.getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))),
      province: lease.parcel?.province?.name || 'Zimbabwe',
      district: lease.parcel?.district?.name || 'District',
      areaHectares: lease.parcel ? Number(lease.parcel.areaHectares) : 0,
      isValid: isActive,
      verifiedAt: now.toISOString(),
      statutoryAct: 'Agricultural Land Settlement Act [Chapter 20:01] & Land Commission Act [Chapter 20:29]',
      issuingAuthority: 'Ministry of Lands & Rural Development, Republic of Zimbabwe',
    };
  }

  /**
   * Update lease status or execute statutory acceptance
   */
  async updateStatus(
    id: string,
    body: { status?: LeaseStatus; termsConditions?: string },
    user: UserProfile,
  ): Promise<LeaseDetail> {
    const lease = await this.leaseRepo.findOne({
      where: { id },
      relations: [
        'parcel',
        'parcel.province',
        'parcel.district',
        'clientProfile',
        'clientProfile.user',
      ],
    });

    if (!lease) {
      throw new NotFoundException(`Lease ${id} not found`);
    }

    this.assertCanAccess(lease, user);

    const fromStatus = lease.status;
    if (body.status) {
      lease.status = body.status;
    }
    if (body.termsConditions) {
      lease.termsConditions = body.termsConditions;
    }

    const savedLease = await this.leaseRepo.save(lease);

    if (body.status === LeaseStatus.ACTIVE && lease.parcel) {
      lease.parcel.status = ParcelStatus.LEASED;
      await this.parcelRepo.save(lease.parcel);
    }

    await this.outboxService.enqueue({
      eventType: body.status === LeaseStatus.ACTIVE ? EventType.LEASE_CREATED : EventType.APPLICATION_STATUS_CHANGED,
      aggregateType: 'LEASE',
      aggregateId: savedLease.id,
      payload: { leaseNumber: savedLease.leaseNumber, status: savedLease.status, fromStatus },
    });

    await this.auditService.logEvent({
      action: AuditAction.UPDATE,
      entityType: 'LEASE',
      entityId: savedLease.id,
      actorId: user.id,
      actorRole: user.role,
      provinceId: lease.parcel?.provinceId,
      metadata: { fromStatus, toStatus: savedLease.status, leaseNumber: savedLease.leaseNumber },
    });

    return this.toDetail(savedLease);
  }
}
