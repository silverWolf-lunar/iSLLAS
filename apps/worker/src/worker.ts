import { EventType, NotificationChannel } from '@sllas/contracts';

export interface OutboxEventRecord {
  id: string;
  eventType: EventType | string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  createdAt?: string;
}

export interface DispatchResult {
  eventId: string;
  eventType: EventType | string;
  aggregateType: string;
  aggregateId: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  recipient: string | null;
}

export const OUTBOX_NOTIFICATION_EVENT_TYPES = new Set([
  EventType.APPLICATION_SUBMITTED,
  EventType.APPLICATION_APPROVED,
  EventType.APPLICATION_REJECTED,
  EventType.APPLICATION_INFO_REQUESTED,
  EventType.OFFER_ISSUED,
  EventType.OFFER_ACCEPTED,
  EventType.LEASE_EXPIRING_SOON,
  EventType.LEASE_EXPIRED,
  EventType.LEASE_RENEWAL_REQUESTED,
]);

export function dispatchNotificationForEvent(event: OutboxEventRecord): DispatchResult | null {
  const payload = (event.payload ?? {}) as Record<string, unknown>;

  if (!OUTBOX_NOTIFICATION_EVENT_TYPES.has(event.eventType as EventType)) {
    return null;
  }

  const leaseNumber = typeof payload.leaseNumber === 'string' ? payload.leaseNumber : 'lease';
  const parcelId = typeof payload.parcelId === 'string' ? payload.parcelId : event.aggregateId;
  const applicationNumber = typeof payload.applicationNumber === 'string' ? payload.applicationNumber : 'application';
  const userId = typeof payload.userId === 'string' ? payload.userId : null;

  const templates: Record<string, { subject: string; body: string; channel: NotificationChannel }> = {
    [EventType.APPLICATION_SUBMITTED]: {
      subject: 'Application submitted',
      body: `Application ${applicationNumber} has been submitted for parcel ${parcelId}.`,
      channel: NotificationChannel.IN_APP,
    },
    [EventType.APPLICATION_APPROVED]: {
      subject: 'Application approved',
      body: `Application ${applicationNumber} has been approved and an offer was issued.`,
      channel: NotificationChannel.EMAIL,
    },
    [EventType.APPLICATION_REJECTED]: {
      subject: 'Application rejected',
      body: `Application ${applicationNumber} was rejected for parcel ${parcelId}.`,
      channel: NotificationChannel.IN_APP,
    },
    [EventType.APPLICATION_INFO_REQUESTED]: {
      subject: 'Additional information requested',
      body: `The registry asked for more information on application ${applicationNumber}.`,
      channel: NotificationChannel.EMAIL,
    },
    [EventType.OFFER_ISSUED]: {
      subject: 'Offer issued',
      body: `Offer for application ${applicationNumber} has been issued.`,
      channel: NotificationChannel.EMAIL,
    },
    [EventType.OFFER_ACCEPTED]: {
      subject: 'Offer accepted',
      body: `Application ${applicationNumber} was accepted and is progressing to agreement signing.`,
      channel: NotificationChannel.IN_APP,
    },
    [EventType.LEASE_EXPIRING_SOON]: {
      subject: 'Lease expiring soon',
      body: `Lease ${leaseNumber} will expire soon; please plan your renewal.`,
      channel: NotificationChannel.IN_APP,
    },
    [EventType.LEASE_EXPIRED]: {
      subject: 'Lease expired',
      body: `Lease ${leaseNumber} has expired and the parcel is again available for allocation.`,
      channel: NotificationChannel.EMAIL,
    },
    [EventType.LEASE_RENEWAL_REQUESTED]: {
      subject: 'Lease renewal requested',
      body: `A renewal request was submitted for lease ${leaseNumber}.`,
      channel: NotificationChannel.IN_APP,
    },
  };

  const template = templates[event.eventType as EventType] ?? {
    subject: 'System notification',
    body: `Notification for ${event.aggregateType}:${event.aggregateId}`,
    channel: NotificationChannel.IN_APP,
  };

  return {
    eventId: event.id,
    eventType: event.eventType,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    channel: template.channel,
    subject: template.subject,
    body: template.body,
    recipient: userId,
  };
}

export interface OutboxSource {
  fetchPendingEvents(): Promise<OutboxEventRecord[]> | OutboxEventRecord[];
}

export function pollOutbox(events: OutboxEventRecord[] = []): {
  processed: number;
  notifications: DispatchResult[];
  status: 'ok' | 'idle';
} {
  const notifications = events
    .map((event) => dispatchNotificationForEvent(event))
    .filter((event): event is DispatchResult => event !== null);

  return {
    processed: notifications.length,
    notifications,
    status: notifications.length > 0 ? 'ok' : 'idle',
  };
}

export function processOutboxBatch(events: OutboxEventRecord[] = []) {
  return pollOutbox(events);
}

export type OutboxAckCallback = (eventId: string, status: 'published' | 'failed', message?: string) => Promise<void> | void;
export type OutboxDeliveryCallback = (notification: DispatchResult) => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string };

export function createOutboxPoller(
  source: OutboxSource,
  intervalMs: number,
  logger: Pick<Console, 'log' | 'warn'> = console,
  ack: OutboxAckCallback | null = null,
  deliver: OutboxDeliveryCallback | null = null,
) {
  let timer: NodeJS.Timeout | null = null;

  const pollOnce = async () => {
    let pending: OutboxEventRecord[];
    try {
      pending = await Promise.resolve(source.fetchPendingEvents());
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logger.warn(`[outbox] could not fetch pending events: ${reason}`);
      return { processed: 0, notifications: [], status: 'error' as const };
    }

    const result = processOutboxBatch(pending);

    if (result.status === 'ok') {
      logger.log(`Processed ${result.processed} pending outbox notifications`);
      result.notifications.forEach((notification) => {
        logger.log(`[outbox] ${notification.eventType} -> ${notification.channel}: ${notification.subject}`);
      });

      for (const notification of result.notifications) {
        try {
          if (deliver) {
            const delivery = await Promise.resolve(deliver(notification));
            if (!delivery.ok) {
              if (ack) {
                await ack(notification.eventId, 'failed', delivery.error ?? 'Notification delivery failed');
              }
              continue;
            }
          }

          if (ack) {
            await ack(notification.eventId, 'published');
          }
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          if (ack) {
            await ack(notification.eventId, 'failed', reason);
          }
          logger.warn(`[outbox] failed to process ${notification.eventId}: ${reason}`);
        }
      }
    } else if (result.status === 'idle') {
      logger.log('No pending outbox notifications');
    }

    return result;
  };

  const start = () => {
    if (timer) return timer;
    timer = setInterval(() => {
      void pollOnce();
    }, intervalMs);
    return timer;
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  return { start, stop, pollOnce };
}
