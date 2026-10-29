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
});
