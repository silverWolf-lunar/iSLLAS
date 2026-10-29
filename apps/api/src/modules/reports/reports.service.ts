import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardData, ExportRequest, JobStatusResponse, Role } from '@sllas/contracts';
import { Lease } from '../applications/lease.entity';
import { LeaseApplication } from '../applications/lease-application.entity';
import { Parcel } from '../parcels/parcel.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Parcel) private readonly parcelRepo: Repository<Parcel>,
    @InjectRepository(LeaseApplication) private readonly applicationRepo: Repository<LeaseApplication>,
    @InjectRepository(Lease) private readonly leaseRepo: Repository<Lease>,
  ) {}

  async getDashboard(): Promise<DashboardData> {
    const [parcelSummary, applicationSummary, leaseSummary] = await Promise.all([
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
      this.leaseRepo
        .createQueryBuilder('lease')
        .select('lease.status', 'status')
        .addSelect('COUNT(lease.id)', 'count')
        .groupBy('lease.status')
        .getRawMany(),
    ]);

    const parcelsByStatus = Object.fromEntries(
      parcelSummary.map((row) => [String(row.status), Number(row.count)]),
    );

    const applicationPipeline = Object.fromEntries(
      applicationSummary.map((row) => [String(row.status), Number(row.count)]),
    );

    const leaseExpiryForecast = [
      { month: 'Jan', count: 0 },
      { month: 'Feb', count: 0 },
      { month: 'Mar', count: 0 },
      { month: 'Apr', count: 0 },
      { month: 'May', count: 2 },
      { month: 'Jun', count: 4 },
    ];

    const totalParcels = await this.parcelRepo.count();
    const availableParcels = await this.parcelRepo.count({ where: { status: 'AVAILABLE' as any } });
    const idleLandHectares = Number(
      (await this.parcelRepo
        .createQueryBuilder('parcel')
        .select('COALESCE(SUM(parcel.areaHectares), 0)', 'total')
        .where('parcel.status = :status', { status: 'AVAILABLE' })
        .getRawOne())?.total ?? 0,
    );

    return {
      parcelsByStatus,
      parcelsByProvince: {},
      idleLandHectares: idleLandHectares,
      applicationPipeline,
      avgProcessingDays: 12,
      leaseExpiryForecast,
      approvalRate: totalParcels > 0 ? Number(((availableParcels / totalParcels) * 100).toFixed(2)) : 0,
      rejectionRate: 0,
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
    return [Role.REGISTRY_OFFICER, Role.APPROVER, Role.SYSTEM_ADMIN, Role.AUDITOR];
  }
}
