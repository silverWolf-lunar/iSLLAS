import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuditEvent } from '../src/modules/audit/audit-event.entity';
import { AuditAction } from '@sllas/contracts';

describe('AuditService (Append-only Audit & Privacy Sanitization)', () => {
  let service: AuditService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation(dto => dto),
      save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'audit-uuid-1', ...entity })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditEvent),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should successfully log domain events', async () => {
    const record = {
      actorId: 'usr-1',
      actorEmail: 'officer@sllas.gov.zw',
      actorRole: 'REGISTRY_OFFICER',
      action: AuditAction.CREATE,
      entityType: 'LAND_PARCEL',
      entityId: 'parcel-101',
      correlationId: 'corr-xyz-123',
    };

    const result = await service.logEvent(record);

    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.id).toBe('audit-uuid-1');
    expect(result.action).toBe(AuditAction.CREATE);
  });

  it('should REDACT passwords, national IDs, and credentials from audit metadata', async () => {
    const record = {
      action: AuditAction.UPDATE,
      entityType: 'CLIENT_PROFILE',
      entityId: 'client-55',
      metadata: {
        companyName: 'Chiredzi Sugar Estate Ltd',
        nationalIdNumber: '63-123456 A 01',
        passwordHash: 'argon2id$v=19$m=65536...',
        nested: {
          secretToken: 'sensitive-oauth-secret',
          publicField: 'safe data',
        },
      },
    };

    await service.logEvent(record);

    const savedCall = mockRepo.save.mock.calls[0][0];
    expect(savedCall.metadata.companyName).toBe('Chiredzi Sugar Estate Ltd');
    expect(savedCall.metadata.nationalIdNumber).toBe('[REDACTED]');
    expect(savedCall.metadata.passwordHash).toBe('[REDACTED]');
    expect(savedCall.metadata.nested.secretToken).toBe('[REDACTED]');
    expect(savedCall.metadata.nested.publicField).toBe('safe data');
  });
});
