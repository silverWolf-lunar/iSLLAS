import nodemailer from 'nodemailer';
import { NotificationChannel } from '@sllas/contracts';

export interface DeliveryEnvelope {
  channel: NotificationChannel;
  to: string;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface DeliveryResult {
  ok: boolean;
  channel: NotificationChannel;
  recipient: string;
  provider: string;
  messageId?: string;
  error?: string;
}

export function createDeliveryTransport() {
  const host = process.env.SMTP_HOST ?? 'localhost';
  const port = Number(process.env.SMTP_PORT ?? 1025);
  const user = process.env.SMTP_USER ?? '';
  const pass = process.env.SMTP_PASS ?? '';
  const isProduction = process.env.NODE_ENV === 'production';
  const requireTLS = isProduction || process.env.SMTP_REQUIRE_TLS === 'true';

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: user || pass ? { user, pass } : undefined,
    requireTLS,
    ignoreTLS: !requireTLS,
  });
}

export async function deliverNotification(envelope: DeliveryEnvelope): Promise<DeliveryResult> {
  const { channel, to, subject, body, metadata } = envelope;

  const transport = createDeliveryTransport();

  try {
    if (channel === NotificationChannel.IN_APP) {
      return {
        ok: true,
        channel,
        recipient: to,
        provider: 'in_app',
        messageId: `in-app:${metadata?.eventId ?? 'local'}`,
      };
    }

    const info = await transport.sendMail({
      from: process.env.SMTP_FROM ?? 'no-reply@sllas.local',
      to,
      subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
    });

    return {
      ok: true,
      channel,
      recipient: to,
      provider: 'smtp',
      messageId: info.messageId,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      channel,
      recipient: to,
      provider: channel === NotificationChannel.EMAIL ? 'smtp' : 'provider',
      error: reason,
    };
  }
}
