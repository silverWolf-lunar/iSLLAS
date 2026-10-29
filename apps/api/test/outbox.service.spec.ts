import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OutboxService } from '../src/modules/outbox/outbox.service';
import { OutboxEvent } from '../src/modules/outbox/outbox-event.entity';
import { OutboxEventStatus, EventType } from '@sllas/contracts';

describe('OutboxService (Transactional Outbox Pattern)', () => {
  let service: OutboxService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn().mockImplementation(event => Promise.resolve({ ...event, id: 'outbox-uuid-1' })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxService,
        {
          provide: getRepositoryToken(OutboxEvent),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<OutboxService>(OutboxService);
  });

  it('should enqueue events with PENDING status and zero retries', async () => {
    const event = await service.enqueue({
      eventType: EventType.PARCEL_CREATED,
      aggregateType: 'PARCEL',
      aggregateId: 'parcel-123',
      payload: { referenceNumber: 'ZW-HRE-2026-001', hectares: 45.5 },
    });

    expect(mockRepo.save).toHaveBeenCalled();
    expect(event.status).toBe(OutboxEventStatus.PENDING);
    expect(event.retryCount).toBe(0);
    expect(event.eventType).toBe(EventType.PARCEL_CREATED);
  });

  it('should support atomic execution via EntityManager', async () => {
    const mockTransactionalRepo = {
      save: jest.fn().mockImplementation(event => Promise.resolve({ ...event, id: 'tx-outbox-uuid' })),
    };
    const mockEntityManager: any = {
      getRepository: jest.fn().mockReturnValue(mockTransactionalRepo),
    };

    const event = await service.enqueue({
      eventType: EventType.APPLICATION_APPROVED,
      aggregateType: 'APPLICATION',
      aggregateId: 'app-999',
      payload: { leaseTermYears: 25 },
      entityManager: mockEntityManager,
    });

    expect(mockEntityManager.getRepository).toHaveBeenCalledWith(OutboxEvent);
    expect(mockTransactionalRepo.save).toHaveBeenCalled();
    expect(event.id).toBe('tx-outbox-uuid');
  });

  it('should increment retryCount and move to FAILED after 5 retries', async () => {
    mockRepo.findOne.mockResolvedValue({
      id: 'outbox-uuid-1',
      retryCount: 4,
    });

    await service.markFailed('outbox-uuid-1', 'Connection timeout to RabbitMQ');

    expect(mockRepo.update).toHaveBeenCalledWith('outbox-uuid-1', {
      status: OutboxEventStatus.FAILED,
      retryCount: 5,
      errorMessage: 'Connection timeout to RabbitMQ',
    });
  });
});
