import { config as loadEnv } from 'dotenv';
import { NotificationChannel } from '@sllas/contracts';
import { createOutboxPoller, pollOutbox, type OutboxEventRecord, type DispatchResult } from './worker';
import { deliverNotification } from './delivery';

loadEnv();

export interface ReminderScheduleEntry {
  daysBefore: number;
  label: string;
  channels: NotificationChannel[];
}

export const reminderSchedule: ReminderScheduleEntry[] = [
  { daysBefore: 180, label: 'Early reminder', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL] },
  { daysBefore: 90, label: 'Renewal reminder', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS] },
  { daysBefore: 60, label: 'Urgent reminder', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH] },
  { daysBefore: 30, label: 'Final warning', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH] },
  { daysBefore: 7, label: 'Last chance', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH] },
  { daysBefore: 0, label: 'Expired', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH] },
];

export function computeLeaseExpiryReminders(expiryDate: Date, now: Date = new Date()): ReminderScheduleEntry[] {
  const msRemaining = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return reminderSchedule.filter((entry) => {
    if (entry.daysBefore === 0) {
      return daysRemaining <= 0 && daysRemaining >= -1;
    }

    return daysRemaining <= entry.daysBefore && daysRemaining > entry.daysBefore - 2;
  });
}

async function fetchPendingOutboxEvents(): Promise<OutboxEventRecord[]> {
  const apiBaseUrl = process.env.OUTBOX_API_URL ?? 'http://localhost:3001';
  const targetUrl = `${apiBaseUrl.replace(/\/$/, '')}/outbox/pending`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.WORKER_API_TOKEN ?? ''}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Outbox endpoint responded with ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload.map((event) => ({
      id: String(event.id),
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: (event.payload ?? {}) as Record<string, unknown>,
      createdAt: typeof event.createdAt === 'string' ? event.createdAt : undefined,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[worker] Could not fetch pending outbox events: ${message}`);
    throw error;
  }
}

async function acknowledgeOutboxEvent(eventId: string, status: 'published' | 'failed', message?: string) {
  const apiBaseUrl = process.env.OUTBOX_API_URL ?? 'http://localhost:3001';
  const targetUrl = `${apiBaseUrl.replace(/\/$/, '')}/outbox/${eventId}/status`;

  try {
    const response = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.WORKER_API_TOKEN ?? ''}`,
      },
      body: JSON.stringify({ status, message }),
    });

    if (!response.ok) {
      throw new Error(`Status update failed with ${response.status}`);
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[worker] Could not acknowledge outbox event ${eventId}: ${reason}`);
  }
}

async function deliverOutboxNotification(notification: DispatchResult) {
  const recipient = notification.recipient ?? process.env.NOTIFY_TEST_EMAIL ?? 'ops@sllas.local';
  const result = await deliverNotification({
    channel: notification.channel,
    to: recipient,
    subject: notification.subject,
    body: notification.body,
    metadata: {
      eventId: notification.eventId,
      aggregateType: notification.aggregateType,
      aggregateId: notification.aggregateId,
    },
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? 'Notification delivery failed' };
  }

  console.log(`[delivery] ${notification.channel} message delivered to ${recipient}: ${notification.subject}`);
  return { ok: true };
}

async function main() {
  if (!process.env.WORKER_API_TOKEN) {
    throw new Error('WORKER_API_TOKEN is required');
  }

  const intervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 60000);

  console.log('🚀 SLLAS worker started');
  console.log(`📅 Lease expiry schedule: ${reminderSchedule.map((item) => `${item.daysBefore}d:${item.label}`).join(', ')}`);
  console.log(`🔄 Poll interval: ${intervalMs} ms`);

  const poller = createOutboxPoller(
    {
      fetchPendingEvents: fetchPendingOutboxEvents,
    },
    intervalMs,
    console,
    async (eventId, status, message) => {
      if (status === 'published') {
        await acknowledgeOutboxEvent(eventId, status, message);
      } else {
        await acknowledgeOutboxEvent(eventId, status, message ?? 'Worker delivery failure');
      }
    },
    deliverOutboxNotification,
  );

  poller.start();
  await poller.pollOnce();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Worker failed to start:', message);
  process.exitCode = 1;
});
