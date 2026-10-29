import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Parcel } from './parcel.entity';
import { LandCategory } from './land-category.entity';
import { ParcelVerification } from './parcel-verification.entity';
import { AdminArea } from '../organizations/admin-area.entity';
import { GeometryUtil } from './geometry.util';
import { OutboxService } from '../outbox/outbox.service';
import { AuditService } from '../audit/audit.service';
import {
  ParcelStatus,
  Role,
  UserProfile,
  EventType,
  AuditAction,
} from '@sllas/contracts';
import {
  CreateParcelInput,
  UpdateParcelInput,
  VerifyParcelInput,
  BulkImportParcelsInput,
  ParcelSearchQuery,
} from '@sllas/validation';

@Injectable()
export class ParcelsService {
  private readonly logger = new Logger(ParcelsService.name);

  constructor(
    @InjectRepository(Parcel)
    private readonly parcelRepo: Repository<Parcel>,
    @InjectRepository(LandCategory)
    private readonly categoryRepo: Repository<LandCategory>,
    @InjectRepository(ParcelVerification)
    private readonly verificationRepo: Repository<ParcelVerification>,
    @InjectRepository(AdminArea)
    private readonly adminAreaRepo: Repository<AdminArea>,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new land parcel with automated area computation and overlap detection
   */
  async create(dto: CreateParcelInput, currentUser: UserProfile): Promise<Parcel> {
    // 1. Validate jurisdiction
    this.assertJurisdiction(currentUser, dto.provinceId, dto.districtId);

    // 2. Validate polygon geometry
    const coords = dto.boundary.coordinates as number[][][];
    const validation = GeometryUtil.validatePolygon(coords);
    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }

    // 3. Compute area and centroid
    const areaHectares = GeometryUtil.computeHectares(coords);
    const centroid = GeometryUtil.computeCentroid(coords);
    const boundaryGeojson: Parcel['boundaryGeojson'] = {
      type: 'Polygon',
      coordinates: coords,
    };

    // 4. Overlap Detection against active parcels
    await this.assertNoOverlap(coords, dto.districtId);

    // 5. Generate human-readable reference number
    const referenceNumber = await this.generateReferenceNumber(dto.provinceId, dto.districtId);

    const parcel = this.parcelRepo.create({
      id: dto.id,
      referenceNumber,
      provinceId: dto.provinceId,
      districtId: dto.districtId,
      wardId: dto.wardId || null,
      landCategoryId: dto.landCategoryId,
      areaHectares,
      boundary: null, // raw PostGIS handled when connected
      boundaryGeojson,
      centroidLat: centroid.lat,
      centroidLng: centroid.lng,
      status: ParcelStatus.DRAFT,
      registeredBy: currentUser.id,
      soilType: dto.attributes?.soilType || null,
      naturalRegion: dto.attributes?.naturalRegion || null,
      rainfallBand: dto.attributes?.rainfallBand || null,
      waterAccess: dto.attributes?.waterAccess ?? false,
      waterSources: dto.attributes?.waterSources || null,
      roadAccess: dto.attributes?.roadAccess || undefined,
      electricityAvailable: dto.attributes?.electricityAvailable ?? false,
      gridProximityKm: dto.attributes?.gridProximityKm || null,
      terrain: dto.attributes?.terrain || undefined,
      currentUse: dto.attributes?.currentUse || 'Idle / Unused',
      previousUse: dto.attributes?.previousUse || null,
      zoningPermittedUses: dto.attributes?.zoningPermittedUses || null,
      restrictions: dto.attributes?.restrictions || null,
      notes: dto.notes || null,
    });

    const saved = await this.parcelRepo.save(parcel);

    // Outbox & Audit
    await this.outboxService.enqueue({
      eventType: EventType.PARCEL_CREATED,
      aggregateType: 'PARCEL',
      aggregateId: saved.id,
      payload: {
        referenceNumber: saved.referenceNumber,
        areaHectares: saved.areaHectares,
        provinceId: saved.provinceId,
        districtId: saved.districtId,
      },
    });

    await this.auditService.logEvent({
      action: AuditAction.CREATE,
      entityType: 'PARCEL',
      entityId: saved.id,
      actorId: currentUser.id,
      actorRole: currentUser.role || Role.REGISTRY_OFFICER,
      provinceId: saved.provinceId,
      metadata: {
        districtId: saved.districtId,
        referenceNumber: saved.referenceNumber,
        status: saved.status,
      },
    });

    return saved;
  }

  /**
   * Update parcel details and boundary with optimistic locking
   */
  async update(id: string, dto: UpdateParcelInput, currentUser: UserProfile): Promise<Parcel> {
    const parcel = await this.parcelRepo.findOne({ where: { id } });
    if (!parcel) {
      throw new NotFoundException(`Parcel ${id} not found`);
    }

    this.assertJurisdiction(currentUser, parcel.provinceId, parcel.districtId);

    if (parcel.version !== dto.version) {
      throw new ConflictException(
        `Optimistic lock failure: parcel was modified by another user (expected version ${dto.version}, found ${parcel.version})`,
      );
    }

    if (dto.boundary) {
      const updateCoords = dto.boundary.coordinates as number[][][];
      const validation = GeometryUtil.validatePolygon(updateCoords);
      if (!validation.isValid) {
        throw new BadRequestException(validation.error);
      }
      await this.assertNoOverlap(updateCoords, parcel.districtId, parcel.id);
      parcel.boundaryGeojson = { type: 'Polygon' as const, coordinates: updateCoords };
      parcel.areaHectares = GeometryUtil.computeHectares(updateCoords);
      const centroid = GeometryUtil.computeCentroid(updateCoords);
      parcel.centroidLat = centroid.lat;
      parcel.centroidLng = centroid.lng;
    }

    if (dto.landCategoryId) parcel.landCategoryId = dto.landCategoryId;
    if (dto.notes !== undefined) parcel.notes = dto.notes;

    if (dto.attributes) {
      if (dto.attributes.soilType !== undefined) parcel.soilType = dto.attributes.soilType;
      if (dto.attributes.naturalRegion !== undefined) parcel.naturalRegion = dto.attributes.naturalRegion;
      if (dto.attributes.rainfallBand !== undefined) parcel.rainfallBand = dto.attributes.rainfallBand;
      if (dto.attributes.waterAccess !== undefined) parcel.waterAccess = dto.attributes.waterAccess ?? false;
      if (dto.attributes.waterSources !== undefined) parcel.waterSources = dto.attributes.waterSources;
      if (dto.attributes.roadAccess !== undefined) parcel.roadAccess = dto.attributes.roadAccess || parcel.roadAccess;
      if (dto.attributes.electricityAvailable !== undefined) parcel.electricityAvailable = dto.attributes.electricityAvailable ?? false;
      if (dto.attributes.gridProximityKm !== undefined) parcel.gridProximityKm = dto.attributes.gridProximityKm;
      if (dto.attributes.terrain !== undefined) parcel.terrain = dto.attributes.terrain || parcel.terrain;
      if (dto.attributes.currentUse !== undefined) parcel.currentUse = dto.attributes.currentUse || parcel.currentUse;
      if (dto.attributes.previousUse !== undefined) parcel.previousUse = dto.attributes.previousUse;
      if (dto.attributes.zoningPermittedUses !== undefined) parcel.zoningPermittedUses = dto.attributes.zoningPermittedUses;
      if (dto.attributes.restrictions !== undefined) parcel.restrictions = dto.attributes.restrictions;
    }

    parcel.version += 1;
    const updated = await this.parcelRepo.save(parcel);

    await this.outboxService.enqueue({
      eventType: EventType.PARCEL_UPDATED,
      aggregateType: 'PARCEL',
      aggregateId: updated.id,
      payload: { referenceNumber: updated.referenceNumber, version: updated.version },
    });

    await this.auditService.logEvent({
      action: AuditAction.UPDATE,
      entityType: 'PARCEL',
      entityId: updated.id,
      actorId: currentUser.id,
      actorRole: currentUser.role || Role.REGISTRY_OFFICER,
      provinceId: updated.provinceId,
      metadata: {
        districtId: updated.districtId,
        referenceNumber: updated.referenceNumber,
        version: updated.version,
      },
    });

    return updated;
  }

  /**
   * Submit parcel for formal verification
   */
  async submitForVerification(id: string, currentUser: UserProfile): Promise<Parcel> {
    const parcel = await this.parcelRepo.findOne({ where: { id } });
    if (!parcel) throw new NotFoundException(`Parcel ${id} not found`);

    this.assertJurisdiction(currentUser, parcel.provinceId, parcel.districtId);

    if (parcel.status !== ParcelStatus.DRAFT) {
      throw new BadRequestException(`Cannot submit parcel in status '${parcel.status}'. Must be in 'DRAFT'.`);
    }

    parcel.status = ParcelStatus.PENDING_VERIFICATION;
    const updated = await this.parcelRepo.save(parcel);

    await this.verificationRepo.save(
      this.verificationRepo.create({
        parcelId: id,
        officerId: currentUser.id,
        action: 'SUBMIT',
        notes: 'Submitted for verification by registry officer',
      }),
    );

    await this.outboxService.enqueue({
      eventType: EventType.PARCEL_STATUS_CHANGED,
      aggregateType: 'PARCEL',
      aggregateId: updated.id,
      payload: { referenceNumber: updated.referenceNumber, status: updated.status },
    });

    return updated;
  }

  /**
   * Officer verification action (VERIFY -> AVAILABLE or RETURN_FOR_CORRECTION -> DRAFT)
   */
  async verify(id: string, dto: VerifyParcelInput, currentUser: UserProfile): Promise<Parcel> {
    const parcel = await this.parcelRepo.findOne({ where: { id } });
    if (!parcel) throw new NotFoundException(`Parcel ${id} not found`);

    this.assertJurisdiction(currentUser, parcel.provinceId, parcel.districtId);

    if (parcel.status !== ParcelStatus.PENDING_VERIFICATION) {
      throw new BadRequestException(
        `Parcel must be in 'PENDING_VERIFICATION' to verify or return. Current status: '${parcel.status}'`,
      );
    }

    if (dto.decision === 'VERIFY') {
      parcel.status = ParcelStatus.AVAILABLE;
      parcel.verifiedBy = currentUser.id;
      parcel.verifiedAt = new Date();
      parcel.rejectionReason = null;
    } else {
      parcel.status = ParcelStatus.DRAFT;
      parcel.rejectionReason = dto.notes;
    }

    const updated = await this.parcelRepo.save(parcel);

    await this.verificationRepo.save(
      this.verificationRepo.create({
        parcelId: id,
        officerId: currentUser.id,
        action: dto.decision,
        notes: dto.notes,
        checklist: dto.checklist || null,
      }),
    );

    await this.outboxService.enqueue({
      eventType: dto.decision === 'VERIFY' ? EventType.PARCEL_VERIFIED : EventType.PARCEL_STATUS_CHANGED,
      aggregateType: 'PARCEL',
      aggregateId: updated.id,
      payload: {
        referenceNumber: updated.referenceNumber,
        status: updated.status,
        verifiedBy: currentUser.id,
        decision: dto.decision,
      },
    });

    await this.auditService.logEvent({
      action: dto.decision === 'VERIFY' ? AuditAction.VERIFY : AuditAction.REJECT,
      entityType: 'PARCEL',
      entityId: updated.id,
      actorId: currentUser.id,
      actorRole: currentUser.role || Role.REGISTRY_OFFICER,
      provinceId: updated.provinceId,
      metadata: {
        districtId: updated.districtId,
        status: updated.status,
        decision: dto.decision,
        notes: dto.notes,
      },
    });

    return updated;
  }

  /**
   * Bulk import parcels with dry-run preview and row-level error reporting
   */
  async bulkImport(
    dto: BulkImportParcelsInput,
    currentUser: UserProfile,
  ): Promise<{
    dryRun: boolean;
    total: number;
    validCount: number;
    errorCount: number;
    results: Array<{ index: number; success: boolean; referenceNumber?: string; error?: string }>;
  }> {
    const results: Array<{ index: number; success: boolean; referenceNumber?: string; error?: string }> = [];
    const validParcels: Array<{ index: number; parcel: CreateParcelInput }> = [];
    const batchBoundaries: number[][][][] = [];

    for (let i = 0; i < dto.parcels.length; i++) {
      const p = dto.parcels[i];
      try {
        // Jurisdiction
        this.assertJurisdiction(currentUser, p.provinceId, p.districtId);

        // Geometry
        const importCoords = p.boundary.coordinates as number[][][];
        const validation = GeometryUtil.validatePolygon(importCoords);
        if (!validation.isValid) {
          throw new BadRequestException(validation.error);
        }

        // Intra-batch overlap check
        for (const existingBatchRing of batchBoundaries) {
          if (GeometryUtil.doPolygonsOverlap(importCoords, existingBatchRing)) {
            throw new ConflictException(`Parcel overlaps with another parcel in this import batch`);
          }
        }

        // Database overlap check
        await this.assertNoOverlap(importCoords, p.districtId);

        batchBoundaries.push(importCoords);
        validParcels.push({ index: i, parcel: p });
        results.push({ index: i, success: true });
      } catch (err) {
        results.push({
          index: i,
          success: false,
          error: err instanceof Error ? err.message : 'Validation failed',
        });
      }
    }

    if (!dto.dryRun && validParcels.length > 0) {
      for (const validParcel of validParcels) {
        const created = await this.create(validParcel.parcel, currentUser);
        const matchResult = results.find(r => r.index === validParcel.index && r.success);
        if (matchResult) {
          matchResult.referenceNumber = created.referenceNumber;
        }
      }
    }

    const validCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return {
      dryRun: dto.dryRun,
      total: dto.parcels.length,
      validCount,
      errorCount,
      results,
    };
  }

  /**
   * Search parcels with spatial queries, attributes, and public access scoping
   */
  async search(
    query: ParcelSearchQuery,
    currentUser?: UserProfile,
  ): Promise<{ data: Parcel[]; total: number; limit: number; offset: number }> {
    const qb = this.parcelRepo.createQueryBuilder('parcel')
      .leftJoinAndSelect('parcel.province', 'province')
      .leftJoinAndSelect('parcel.district', 'district')
      .leftJoinAndSelect('parcel.landCategory', 'landCategory');

    // Public / Client users can ONLY view AVAILABLE parcels
    const isPublicUser = !currentUser || currentUser.role === Role.CLIENT;
    if (isPublicUser) {
      qb.andWhere('parcel.status = :availableStatus', { availableStatus: ParcelStatus.AVAILABLE });
    } else if (query.status) {
      qb.andWhere('parcel.status = :status', { status: query.status });
    }

    // Role-based jurisdiction scoping for registry officers
    if (currentUser?.role === Role.REGISTRY_OFFICER && currentUser.provinceId) {
      qb.andWhere('parcel.provinceId = :userProvince', { userProvince: currentUser.provinceId });
    }

    // Attribute Filters
    if (query.provinceId) qb.andWhere('parcel.provinceId = :provinceId', { provinceId: query.provinceId });
    if (query.districtId) qb.andWhere('parcel.districtId = :districtId', { districtId: query.districtId });
    if (query.landCategoryId) qb.andWhere('parcel.landCategoryId = :categoryId', { categoryId: query.landCategoryId });
    if (query.naturalRegion) qb.andWhere('parcel.naturalRegion = :naturalRegion', { naturalRegion: query.naturalRegion });
    if (query.soilType) qb.andWhere('parcel.soilType = :soilType', { soilType: query.soilType });
    if (query.minHectares) qb.andWhere('parcel.areaHectares >= :minHectares', { minHectares: query.minHectares });
    if (query.maxHectares) qb.andWhere('parcel.areaHectares <= :maxHectares', { maxHectares: query.maxHectares });
    if (query.roadAccess) qb.andWhere('parcel.roadAccess = :roadAccess', { roadAccess: query.roadAccess });
    if (query.waterAccess !== undefined) qb.andWhere('parcel.waterAccess = :waterAccess', { waterAccess: query.waterAccess });
    if (query.electricityAvailable !== undefined) qb.andWhere('parcel.electricityAvailable = :electricity', { electricity: query.electricityAvailable });

    // Spatial Bounding Box Filter
    if (query.bbox) {
      const [minLng, minLat, maxLng, maxLat] = query.bbox.split(',').map(Number);
      if (!isNaN(minLng) && !isNaN(minLat) && !isNaN(maxLng) && !isNaN(maxLat)) {
        qb.andWhere(
          'parcel.centroidLng >= :minLng AND parcel.centroidLng <= :maxLng AND parcel.centroidLat >= :minLat AND parcel.centroidLat <= :maxLat',
          { minLng, maxLng, minLat, maxLat },
        );
      }
    }

    const limit = query.limit || 20;
    const offset = 0;

    qb.orderBy('parcel.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, limit, offset };
  }

  async findById(id: string): Promise<Parcel> {
    const parcel = await this.parcelRepo.findOne({
      where: { id },
      relations: ['province', 'district', 'landCategory'],
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel ${id} not found`);
    }

    return parcel;
  }

  async getCategories(): Promise<LandCategory[]> {
    return this.categoryRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  /**
   * Helper: asserts user has jurisdiction over the given province/district
   */
  private assertJurisdiction(user: UserProfile, provinceId: string, districtId: string): void {
    if (user.role === Role.SYSTEM_ADMIN || user.role === Role.AUDITOR) {
      return; // National jurisdiction
    }

    if (user.role === Role.REGISTRY_OFFICER || user.role === Role.APPROVER) {
      if (user.provinceId && user.provinceId !== provinceId) {
        throw new ForbiddenException(
          `Jurisdiction violation: you are assigned to province '${user.provinceId}' and cannot act on '${provinceId}'`,
        );
      }
      if (user.districtId && user.districtId !== districtId) {
        throw new ForbiddenException(
          `Jurisdiction violation: you are assigned to district '${user.districtId}' and cannot act on '${districtId}'`,
        );
      }
    }
  }

  /**
   * Helper: detects whether the candidate polygon overlaps with any active parcel in the database
   */
  private async assertNoOverlap(
    candidateRing: number[][][],
    districtId: string,
    excludeParcelId?: string,
  ): Promise<void> {
    const activeParcels = await this.parcelRepo.find({
      where: {
        districtId,
        status: In([
          ParcelStatus.PENDING_VERIFICATION,
          ParcelStatus.AVAILABLE,
          ParcelStatus.RESERVED,
          ParcelStatus.ALLOCATED,
          ParcelStatus.LEASED,
        ]),
      },
    });

    for (const existing of activeParcels) {
      if (excludeParcelId && existing.id === excludeParcelId) continue;
      if (!existing.boundaryGeojson?.coordinates) continue;

      if (GeometryUtil.doPolygonsOverlap(candidateRing, existing.boundaryGeojson.coordinates)) {
        throw new ConflictException(
          `Spatial overlap conflict: proposed parcel boundary overlaps with active parcel '${existing.referenceNumber}' (${existing.areaHectares} ha)`,
        );
      }
    }
  }

  /**
   * Helper: generates unique human-readable parcel reference number
   * Format: ZW-PRV-DIST-YYYY-XXXX
   */
  private async generateReferenceNumber(provinceId: string, districtId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.parcelRepo.count();
    const seq = String(count + 1).padStart(4, '0');

    // Retrieve province code
    const prov = await this.adminAreaRepo.findOne({ where: { id: provinceId } });
    const dist = await this.adminAreaRepo.findOne({ where: { id: districtId } });

    const provCode = prov?.code ? prov.code.replace('ZW-', '').toUpperCase() : 'PRV';
    const distCode = dist?.code ? dist.code.substring(0, 3).toUpperCase() : 'DST';

    return `ZW-${provCode}-${distCode}-${year}-${seq}`;
  }
}
