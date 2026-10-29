import { NotificationChannel, NotificationDeliveryStatus } from '@sllas/contracts';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationsRepo: any;
  let preferencesRepo: any;
  let templatesRepo: any;

  beforeEach(() => {
    notificationsRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(async (entity) => entity),
      create: jest.fn((entity) => entity),
    };
    preferencesRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(async (entity) => entity),
      create: jest.fn((entity) => entity),
    };
    templatesRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(async (entity) => entity),
      create: jest.fn((entity) => entity),
    };

    service = new NotificationsService(
      notificationsRepo,
      preferencesRepo,
      templatesRepo,
    );
  });

  it('exposes the configured lease-expiry reminder schedule', () => {
    expect(NotificationsService.getLeaseExpiryReminderSchedule()).toEqual(expect.arrayContaining([
      expect.objectContaining({ daysBefore: 180, label: 'Early reminder' }),
      expect.objectContaining({ daysBefore: 90, label: 'Renewal reminder' }),
      expect.objectContaining({ daysBefore: 7, label: 'Last chance' }),
      expect.objectContaining({ daysBefore: 0, label: 'Expired' }),
    ]));
  });

  it('renders a notification template using supplied variables', async () => {
    templatesRepo.findOne.mockResolvedValue({
      code: 'LEASE_EXPIRY',
      isActive: true,
      subjectTemplate: 'Lease {{leaseNumber}} expiring soon',
      bodyTemplate: 'Your lease will expire in {{daysRemaining}} days.',
    });

    const created = await service.createTemplateNotification(
      'user-1',
      'LEASE_EXPIRY',
      { leaseNumber: 'LS-2026-001', daysRemaining: 30 },
      NotificationChannel.EMAIL,
    );

    expect(created.subject).toBe('Lease LS-2026-001 expiring soon');
    expect(created.body).toBe('Your lease will expire in 30 days.');
    expect(created.channel).toBe(NotificationChannel.EMAIL);
    expect(created.status).toBe(NotificationDeliveryStatus.QUEUED);
  });

  it('selects the active lease-expiry reminder threshold for the next due alert', () => {
    const reminder = service.buildLeaseExpiryNotifications(
      'user-1',
      'LS-2026-001',
      new Date('2026-07-31'),
      new Date('2026-07-01'),
    );

    expect(reminder).toEqual([
      expect.objectContaining({ daysBefore: 30, label: 'Final warning' }),
    ]);
  });
});
