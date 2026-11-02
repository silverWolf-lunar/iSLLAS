import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AdminAreaLevel,
  ApplicationStatus,
  DashboardData,
  ExportRequest,
  IdleLandProvinceSummary,
  IdleLandReportResponse,
  JobStatusResponse,
  LeaseStatus,
  Role,
} from '@sllas/contracts';
import { Lease } from '../applications/lease.entity';
import { LeaseApplication } from '../applications/lease-application.entity';
import { Parcel } from '../parcels/parcel.entity';
import { AdminArea } from '../organizations/admin-area.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Parcel) private readonly parcelRepo: Repository<Parcel>,
    @InjectRepository(LeaseApplication) private readonly applicationRepo: Repository<LeaseApplication>,
    @InjectRepository(Lease) private readonly leaseRepo: Repository<Lease>,
    @InjectRepository(AdminArea) private readonly adminAreaRepo: Repository<AdminArea>,
  ) {}

  /**
   * Generates a comprehensive idle land breakdown across provinces in Zimbabwe
   */
  async getIdleLandReport(): Promise<IdleLandReportResponse> {
    // 1. Fetch all administrative provinces
    const provinces = await this.adminAreaRepo.find({
      where: { level: AdminAreaLevel.PROVINCE },
      order: { name: 'ASC' },
    });

    // 2. Query aggregate metrics by provinceId directly from parcels
    const parcelProvinceStats = await this.parcelRepo
      .createQueryBuilder('parcel')
      .select('parcel.provinceId', 'provinceId')
      .addSelect('COUNT(parcel.id)', 'totalParcels')
      .addSelect(`COUNT(CASE WHEN parcel.status = 'AVAILABLE' THEN 1 END)`, 'idleParcels')
      .addSelect('COALESCE(SUM(parcel.areaHectares), 0)', 'totalHectares')
      .addSelect(`COALESCE(SUM(CASE WHEN parcel.status = 'AVAILABLE' THEN parcel.areaHectares ELSE 0 END), 0)`, 'idleHectares')
      .groupBy('parcel.provinceId')
      .getRawMany();

    const statsMap = new Map<string, { totalParcels: string; idleParcels: string; totalHectares: string; idleHectares: string }>(
      parcelProvinceStats.map((s) => [s.provinceId, s]),
    );

    let totalParcelsSum = 0;
    let idleParcelsSum = 0;
    let totalHectaresSum = 0;
    let idleHectaresSum = 0;

    const provinceSummaries: IdleLandProvinceSummary[] = provinces.map((p) => {
      const stats = statsMap.get(p.id);
      const totalParcels = stats ? Number(stats.totalParcels) : 0;
      const idleParcels = stats ? Number(stats.idleParcels) : 0;
      const totalHectares = stats ? Number(Number(stats.totalHectares).toFixed(2)) : 0;
      const idleHectares = stats ? Number(Number(stats.idleHectares).toFixed(2)) : 0;
      const utilizationRate = totalHectares > 0
        ? Number((((totalHectares - idleHectares) / totalHectares) * 100).toFixed(1))
        : 0;

      totalParcelsSum += totalParcels;
      idleParcelsSum += idleParcels;
      totalHectaresSum += totalHectares;
      idleHectaresSum += idleHectares;

      return {
        provinceId: p.id,
        provinceName: p.name,
        totalParcels,
        idleParcels,
        totalHectares,
        idleHectares,
        utilizationRate,
      };
    });

    // Handle any orphan parcel records belonging to provinces not in admin_areas table
    for (const [provId, stats] of statsMap.entries()) {
      if (!provinces.some((p) => p.id === provId)) {
        const totalParcels = Number(stats.totalParcels);
        const idleParcels = Number(stats.idleParcels);
        const totalHectares = Number(Number(stats.totalHectares).toFixed(2));
        const idleHectares = Number(Number(stats.idleHectares).toFixed(2));
        const utilizationRate = totalHectares > 0
          ? Number((((totalHectares - idleHectares) / totalHectares) * 100).toFixed(1))
          : 0;

        totalParcelsSum += totalParcels;
        idleParcelsSum += idleParcels;
        totalHectaresSum += totalHectares;
        idleHectaresSum += idleHectares;

        provinceSummaries.push({
          provinceId: provId,
          provinceName: 'Other Administrative Area',
          totalParcels,
          idleParcels,
          totalHectares,
          idleHectares,
          utilizationRate,
        });
      }
    }

    const overallUtilizationRate = totalHectaresSum > 0
      ? Number((((totalHectaresSum - idleHectaresSum) / totalHectaresSum) * 100).toFixed(1))
      : 0;

    return {
      summary: {
        totalParcels: totalParcelsSum,
        idleParcels: idleParcelsSum,
        totalHectares: Number(totalHectaresSum.toFixed(2)),
        idleHectares: Number(idleHectaresSum.toFixed(2)),
        overallUtilizationRate,
      },
      provinces: provinceSummaries,
    };
  }

  async getDashboard(): Promise<DashboardData> {
    const [parcelSummary, applicationSummary, idleLandReport] = await Promise.all([
      this.parcelRepo
        .createQueryBuilder('parcel')
        .select('parcel.status', 'status')
        .addSelect('COUNT(parcel.id)', 'count')
        .groupBy('parcel.status')
        .getRawMany(),
      this.applicationRepo
        .createQueryBuilder('application')
        .select('application.status', 'status')
        .addSelect('COUNT(application.id)', 'count')
        .groupBy('application.status')
        .getRawMany(),
      this.getIdleLandReport(),
    ]);

    const parcelsByStatus = Object.fromEntries(
      parcelSummary.map((row) => [String(row.status), Number(row.count)]),
    );

    const applicationPipeline = Object.fromEntries(
      applicationSummary.map((row) => [String(row.status), Number(row.count)]),
    );

    // Build real parcelsByProvince mapping from the provincial breakdown
    const parcelsByProvince: Record<string, number> = {};
    for (const prov of idleLandReport.provinces) {
      parcelsByProvince[prov.provinceName] = prov.totalParcels;
    }

    // Dynamic 6-month lease expiry forecast based on actual lease end dates
    const months: Array<{ label: string; start: Date; end: Date; count: number }> = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const start = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      months.push({
        label: `${monthNames[start.getMonth()]}${start.getFullYear() !== now.getFullYear() ? ` '${String(start.getFullYear()).slice(2)}` : ''}`,
        start,
        end,
        count: 0,
      });
    }

    const windowStart = months[0].start.toISOString().slice(0, 10);
    const windowEnd = months[months.length - 1].end.toISOString().slice(0, 10);

    const expiringLeases = await this.leaseRepo
      .createQueryBuilder('lease')
      .select('lease.endDate', 'endDate')
      .where('lease.endDate >= :windowStart AND lease.endDate < :windowEnd', { windowStart, windowEnd })
      .andWhere('lease.status NOT IN (:...terminalStatuses)', {
        terminalStatuses: [LeaseStatus.TERMINATED, LeaseStatus.EXPIRED],
      })
      .getRawMany();

    for (const lease of expiringLeases) {
      const leaseEndDate = new Date(lease.endDate);
      for (const m of months) {
        if (leaseEndDate >= m.start && leaseEndDate < m.end) {
          m.count += 1;
          break;
        }
      }
    }

    const leaseExpiryForecast = months.map((m) => ({ month: m.label, count: m.count }));

    // Real approval and rejection rates based on lease applications
    const totalApplications = await this.applicationRepo.count();
    const approvedApplications = await this.applicationRepo.count({
      where: [
        { status: ApplicationStatus.APPROVED },
        { status: ApplicationStatus.OFFER_ISSUED },
        { status: ApplicationStatus.ACCEPTED },
        { status: ApplicationStatus.AGREEMENT_SIGNED },
        { status: ApplicationStatus.ACTIVE },
      ],
    });
    const rejectedApplications = await this.applicationRepo.count({
      where: { status: ApplicationStatus.REJECTED },
    });

    const approvalRate = totalApplications > 0
      ? Number(((approvedApplications / totalApplications) * 100).toFixed(1))
      : 0;
    const rejectionRate = totalApplications > 0
      ? Number(((rejectedApplications / totalApplications) * 100).toFixed(1))
      : 0;

    return {
      parcelsByStatus,
      parcelsByProvince,
      idleLandHectares: idleLandReport.summary.idleHectares,
      idleLandByProvince: idleLandReport.provinces,
      applicationPipeline,
      avgProcessingDays: 12,
      leaseExpiryForecast,
      approvalRate,
      rejectionRate,
    };
  }

  async exportReport(_request: ExportRequest): Promise<JobStatusResponse> {
    this.logger.log(`Export requested for ${_request.reportType} as ${_request.format}`);
    return {
      jobId: `report-${Date.now()}`,
      status: 'QUEUED',
      progress: 0,
      resultUrl: null,
      errorMessage: null,
    } as JobStatusResponse;
  }

  async getAllowedRolesForReports(): Promise<string[]> {
    return [Role.REGISTRY_OFFICER, Role.APPROVER, Role.ESTATES_OFFICER, Role.SYSTEM_ADMIN, Role.AUDITOR];
  }
}
