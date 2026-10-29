import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationChannel, NotificationDeliveryStatus } from '@sllas/contracts';
import { Notification } from './notification.entity';
import { NotificationPreference } from './notification-preference.entity';
import { NotificationTemplate } from './notification-template.entity';

export interface LeaseExpiryReminderScheduleItem {
  daysBefore: number;
  label: string;
  channels: NotificationChannel[];
}

@Injectable()
export class NotificationsService {
  static readonly leaseExpiryReminderSchedule: LeaseExpiryReminderScheduleItem[] = [
    { daysBefore: 180, label: 'Early reminder', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL] },
    { daysBefore: 90, label: 'Renewal reminder', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS] },
    { daysBefore: 60, label: 'Urgent reminder', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH] },
    { daysBefore: 30, label: 'Final warning', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH] },
    { daysBefore: 7, label: 'Last chance', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH] },
    { daysBefore: 0, label: 'Expired', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH] },
  ];

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly preferencesRepo: Repository<NotificationPreference>,
    @InjectRepository(NotificationTemplate)
    private readonly templatesRepo: Repository<NotificationTemplate>,
  ) {}

  static getLeaseExpiryReminderSchedule(): LeaseExpiryReminderScheduleItem[] {
    return NotificationsService.leaseExpiryReminderSchedule.map((reminder) => ({
      ...reminder,
      channels: [...reminder.channels],
    }));
  }

  async listPreferences(userId: string): Promise<Record<NotificationChannel, boolean>> {
    const channels = Object.values(NotificationChannel);
    const prefs = await this.preferencesRepo.find({ where: { userId } });
    const map = new Map(prefs.map((pref) => [pref.channel, pref.enabled]));

    return channels.reduce((acc, channel) => {
      acc[channel] = map.get(channel) ?? true;
      return acc;
    }, {} as Record<NotificationChannel, boolean>);
  }

  async upsertPreferences(userId: string, preferences: Array<{ channel: NotificationChannel; enabled: boolean }>) {
    const saved: NotificationPreference[] = [];

    for (const pref of preferences) {
      const record = await this.preferencesRepo.findOne({ where: { userId, channel: pref.channel } });
      if (record) {
        record.enabled = pref.enabled;
        saved.push(await this.preferencesRepo.save(record));
        continue;
      }

      const created = this.preferencesRepo.create({
        userId,
        channel: pref.channel,
        enabled: pref.enabled,
      });
      saved.push(await this.preferencesRepo.save(created));
    }

    return saved;
  }

  async listTemplates() {
    return this.templatesRepo.find({
      where: { isActive: true },
      order: { channel: 'ASC', code: 'ASC' },
    });
  }

  async listForUser(userId: string) {
    return this.notificationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  renderTemplate(template: Pick<NotificationTemplate, 'subjectTemplate' | 'bodyTemplate'> | null, context: Record<string, unknown> = {}) {
    const subject = template?.subjectTemplate ? this.interpolate(template.subjectTemplate, context) : null;
    const body = template?.bodyTemplate ? this.interpolate(template.bodyTemplate, context) : '';
    return { subject, body };
  }

  async createTemplateNotification(
    userId: string,
    templateCode: string,
    context: Record<string, unknown> = {},
    channel: NotificationChannel = NotificationChannel.IN_APP,
  ) {
    const template = await this.templatesRepo.findOne({ where: { code: templateCode, isActive: true } });
    if (!template) {
      throw new NotFoundException(`Notification template ${templateCode} not found`);
    }

    const { subject, body } = this.renderTemplate(template, context);
    const notification = this.notificationsRepo.create({
      userId,
      channel,
      templateCode: template.code,
      status: NotificationDeliveryStatus.QUEUED,
      subject: subject ?? null,
      body,
      data: context,
    });

    return this.notificationsRepo.save(notification);
  }

  buildLeaseExpiryNotifications(
    userId: string,
    leaseNumber: string,
    expiryDate: Date,
    now: Date = new Date(),
  ): LeaseExpiryReminderScheduleItem[] {
    const elapsedMs = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(elapsedMs / (1000 * 60 * 60 * 24));
    const thresholds = NotificationsService.getLeaseExpiryReminderSchedule();

    const matching = thresholds.filter((threshold) => {
      if (threshold.daysBefore === 0) {
        return daysRemaining <= 0 && daysRemaining >= -1;
      }
      return daysRemaining <= threshold.daysBefore && daysRemaining > threshold.daysBefore - 2;
    });

    if (matching.length === 0) {
      return [];
    }

    return matching.map((threshold) => ({ ...threshold }));
  }

  async createInAppNotification(userId: string, subject: string, body: string, data: Record<string, unknown> = {}) {
    const notification = this.notificationsRepo.create({
      userId,
      channel: NotificationChannel.IN_APP,
      status: NotificationDeliveryStatus.QUEUED,
      subject,
      body,
      data,
    });

    return this.notificationsRepo.save(notification);
  }

  async markNotificationRead(notificationId: string, userId: string) {
    const notification = await this.notificationsRepo.findOne({ where: { id: notificationId, userId } });
    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    notification.readAt = new Date();
    return this.notificationsRepo.save(notification);
  }

  private interpolate(template: string, context: Record<string, unknown>): string {
    return template.replace(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g, (_, key: string) => {
      const value = key.split('.').reduce<unknown>((acc, part) => {
        if (acc && typeof acc === 'object' && part in acc) {
          return (acc as Record<string, unknown>)[part];
        }
        return undefined;
      }, context as unknown);

      return value === undefined || value === null ? '' : String(value);
    });
  }
}
