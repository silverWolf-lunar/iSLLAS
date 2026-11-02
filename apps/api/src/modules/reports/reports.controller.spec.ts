import { Test } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  it('returns a dashboard summary payload', async () => {
    const service = {
      getDashboard: jest.fn().mockResolvedValue({
        parcelsByStatus: { AVAILABLE: 12 },
        parcelsByProvince: {},
        idleLandHectares: 40,
        applicationPipeline: { SUBMITTED: 5 },
        avgProcessingDays: 11,
        leaseExpiryForecast: [{ month: 'Jun', count: 2 }],
        approvalRate: 88,
        rejectionRate: 4,
      }),
      exportReport: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: service }],
    }).compile();

    const controller = module.get(ReportsController);
    await expect(controller.getDashboard()).resolves.toMatchObject({ parcelsByStatus: { AVAILABLE: 12 } });
  });

  it('returns idle land breakdown across provinces', async () => {
    const service = {
      getDashboard: jest.fn(),
      getIdleLandReport: jest.fn().mockResolvedValue({
        summary: {
          totalParcels: 20,
          idleParcels: 8,
          totalHectares: 1250.5,
          idleHectares: 450.2,
          overallUtilizationRate: 64.0,
        },
        provinces: [
          {
            provinceId: 'p-1',
            provinceName: 'Mashonaland Central',
            totalParcels: 10,
            idleParcels: 4,
            totalHectares: 600,
            idleHectares: 200,
            utilizationRate: 66.7,
          },
        ],
      }),
      exportReport: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: service }],
    }).compile();

    const controller = module.get(ReportsController);
    const result = await controller.getIdleLandReport();
    expect(result.summary.idleParcels).toBe(8);
    expect(result.provinces).toHaveLength(1);
    expect(result.provinces[0].provinceName).toBe('Mashonaland Central');
  });
});
