import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientType, EventType, Role, UserProfile, VerificationStatus, AuditAction } from '@sllas/contracts';
import { ClientProfileInput, VerifyClientProfileInput, ClientDocumentInput } from '@sllas/validation';
import { ClientProfile } from './client-profile.entity';
import { OutboxService } from '../outbox/outbox.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ClientProfilesService {
  constructor(
    @InjectRepository(ClientProfile)
    private readonly profileRepo: Repository<ClientProfile>,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
  ) {}

  async getOwnProfile(user: UserProfile): Promise<ClientProfile> {
    this.assertClient(user);
    const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
    if (!profile) throw new NotFoundException('Client profile not found');
    return profile;
  }

  async upsertOwnProfile(dto: ClientProfileInput, user: UserProfile): Promise<ClientProfile> {
    this.assertClient(user);
    const existing = await this.profileRepo.findOne({ where: { userId: user.id } });
    const profile = existing || this.profileRepo.create({ userId: user.id });

    profile.clientType = dto.clientType;
    profile.nationalIdNumber = dto.clientType === ClientType.INDIVIDUAL ? dto.nationalIdNumber || null : null;
    profile.registrationNumber = dto.clientType === ClientType.BUSINESS ? dto.registrationNumber || null : null;
    profile.companyName = dto.clientType === ClientType.BUSINESS ? dto.companyName || null : null;
    profile.taxClearanceNumber = dto.taxClearanceNumber || null;
    profile.address = dto.address;
    profile.provinceId = dto.provinceId;
    profile.districtId = dto.districtId;
    profile.directors = dto.directors
      ? dto.directors as ClientProfile['directors']
      : null;
    // A changed profile must be reviewed again before it can submit applications.
    profile.verificationStatus = VerificationStatus.PENDING;
    profile.verificationReason = null;
    profile.verifiedBy = null;
    profile.verifiedAt = null;

    const saved = await this.profileRepo.save(profile);
    await this.auditService.logEvent({
      action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
      entityType: 'CLIENT_PROFILE',
      entityId: saved.id,
      actorId: user.id,
      actorRole: user.role,
      provinceId: saved.provinceId,
      metadata: { verificationStatus: saved.verificationStatus },
    });
    return saved;
  }

  async attachDocument(
    doc: ClientDocumentInput,
    user: UserProfile,
  ): Promise<ClientProfile> {
    this.assertClient(user);
    const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
    if (!profile) {
      throw new NotFoundException('Client profile not found. Please create your profile before uploading documents.');
    }

    const currentDocs = profile.documents || [];
    const newDoc = {
      id: crypto.randomUUID(),
      type: doc.type,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSizeBytes: doc.fileSizeBytes,
      mimeType: doc.mimeType,
      status: 'UPLOADED',
      uploadedAt: new Date().toISOString(),
    };

    profile.documents = [...currentDocs.filter(d => d.type !== doc.type), newDoc];
    profile.verificationStatus = VerificationStatus.PENDING;
    const saved = await this.profileRepo.save(profile);

    await this.auditService.logEvent({
      action: AuditAction.UPLOAD,
      entityType: 'CLIENT_PROFILE',
      entityId: saved.id,
      actorId: user.id,
      actorRole: user.role,
      provinceId: saved.provinceId,
      metadata: { documentType: doc.type, fileName: doc.fileName },
    });

    return saved;
  }

  async listProfiles(
    filters: { status?: VerificationStatus; provinceId?: string; districtId?: string; search?: string } = {},
    user: UserProfile,
  ): Promise<ClientProfile[]> {
    if (
      user.role !== Role.REGISTRY_OFFICER &&
      user.role !== Role.ESTATES_OFFICER &&
      user.role !== Role.APPROVER &&
      user.role !== Role.SYSTEM_ADMIN &&
      user.role !== Role.AUDITOR
    ) {
      throw new ForbiddenException('You are not permitted to inspect applicant review queues');
    }

    const qb = this.profileRepo.createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('profile.province', 'province')
      .leftJoinAndSelect('profile.district', 'district')
      .orderBy('profile.updatedAt', 'DESC');

    if (user.role === Role.REGISTRY_OFFICER || user.role === Role.APPROVER || user.role === Role.ESTATES_OFFICER) {
      if (user.provinceId) qb.andWhere('profile.provinceId = :pId', { pId: user.provinceId });
      if (user.districtId) qb.andWhere('profile.districtId = :dId', { dId: user.districtId });
    }

    if (filters.status) {
      qb.andWhere('profile.verificationStatus = :status', { status: filters.status });
    }
    if (filters.provinceId) {
      qb.andWhere('profile.provinceId = :qProvinceId', { qProvinceId: filters.provinceId });
    }
    if (filters.districtId) {
      qb.andWhere('profile.districtId = :qDistrictId', { qDistrictId: filters.districtId });
    }
    if (filters.search) {
      qb.andWhere(
        '(LOWER(profile.nationalIdNumber) LIKE :s OR LOWER(profile.companyName) LIKE :s OR LOWER(profile.registrationNumber) LIKE :s OR LOWER(user.firstName) LIKE :s OR LOWER(user.lastName) LIKE :s)',
        { s: `%${filters.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async getProfileById(id: string, user: UserProfile): Promise<ClientProfile> {
    const profile = await this.profileRepo.findOne({
      where: { id },
      relations: ['user', 'province', 'district'],
    });
    if (!profile) throw new NotFoundException(`Client profile ${id} not found`);

    if (user.role === Role.CLIENT && profile.userId !== user.id) {
      throw new ForbiddenException('You cannot inspect other client profiles');
    }
    if (
      (user.role === Role.REGISTRY_OFFICER || user.role === Role.APPROVER || user.role === Role.ESTATES_OFFICER) &&
      user.provinceId &&
      user.provinceId !== profile.provinceId
    ) {
      throw new ForbiddenException('Client profile is outside your provincial jurisdiction');
    }

    return profile;
  }

  async verifyProfile(
    id: string,
    dto: VerifyClientProfileInput,
    user: UserProfile,
  ): Promise<ClientProfile> {
    this.assertVerifier(user);
    const profile = await this.profileRepo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException(`Client profile ${id} not found`);
    this.assertJurisdiction(user, profile.provinceId, profile.districtId);

    profile.verificationStatus = dto.decision === 'VERIFY'
      ? VerificationStatus.VERIFIED
      : VerificationStatus.REJECTED;
    profile.verificationReason = dto.decision === 'REJECT' ? dto.reason || null : null;
    profile.verifiedBy = user.id;
    profile.verifiedAt = new Date();
    const saved = await this.profileRepo.save(profile);

    await this.outboxService.enqueue({
      eventType: dto.decision === 'VERIFY'
        ? EventType.CLIENT_PROFILE_VERIFIED
        : EventType.CLIENT_PROFILE_REJECTED,
      aggregateType: 'CLIENT_PROFILE',
      aggregateId: saved.id,
      payload: { userId: saved.userId, verificationStatus: saved.verificationStatus },
    });
    await this.auditService.logEvent({
      action: dto.decision === 'VERIFY' ? AuditAction.VERIFY : AuditAction.REJECT,
      entityType: 'CLIENT_PROFILE',
      entityId: saved.id,
      actorId: user.id,
      actorRole: user.role,
      provinceId: saved.provinceId,
      metadata: { verificationStatus: saved.verificationStatus, reason: profile.verificationReason },
    });
    return saved;
  }

  private assertClient(user: UserProfile): void {
    if (user.role !== Role.CLIENT) {
      throw new ForbiddenException('Only client accounts can manage a client profile');
    }
  }

  private assertVerifier(user: UserProfile): void {
    if (user.role !== Role.REGISTRY_OFFICER && user.role !== Role.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only registry officers can verify client profiles');
    }
  }

  private assertJurisdiction(user: UserProfile, provinceId: string, districtId: string): void {
    if (user.role === Role.SYSTEM_ADMIN) return;
    if (user.provinceId && user.provinceId !== provinceId) {
      throw new ForbiddenException('Client profile is outside your provincial jurisdiction');
    }
    if (user.districtId && user.districtId !== districtId) {
      throw new ForbiddenException('Client profile is outside your district jurisdiction');
    }
  }
}
