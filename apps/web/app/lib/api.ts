/**
 * Helpers for talking to the SLLAS API through the authenticated Next.js proxy
 * (`/api/backend/...`). Every API response is wrapped by the server's
 * TransformResponseInterceptor as `{ data, correlationId }`, and failures are
 * returned as `{ error: { code, message, details, correlationId } }`.
 */

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
}

/** Extracts a human-readable message from any error shape the API/proxy can return. */
export function extractApiError(payload: any, fallback: string): string {
  if (!payload) return fallback;
  const nested = payload.error;
  const rawMessage =
    (typeof nested === 'object' && nested?.message) ||
    (typeof nested === 'string' && nested) ||
    payload.message;

  const details = typeof nested === 'object' ? nested?.details?.validationErrors : undefined;
  const errors: Array<{ path?: string; message?: string }> | undefined =
    (typeof nested === 'object' && Array.isArray(nested?.errors) && nested.errors) ||
    (Array.isArray(payload.errors) && payload.errors) ||
    undefined;

  if (errors && errors.length > 0) {
    const first = errors[0];
    const where = first.path ? `${first.path}: ` : '';
    return `${rawMessage ?? fallback} — ${where}${first.message ?? 'invalid value'}`;
  }
  if (Array.isArray(details) && details.length > 0) return String(details[0]);
  if (Array.isArray(rawMessage)) return String(rawMessage[0]);
  return typeof rawMessage === 'string' && rawMessage ? rawMessage : fallback;
}

/** Calls the API through the proxy and unwraps the `{ data }` envelope. */
export async function apiRequest<T = any>(
  path: string,
  init?: RequestInit,
  fallbackError = 'Request failed',
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`/api/backend/api/v1/${path.replace(/^\//, '')}`, {
      cache: 'no-store',
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    });
    const payload = await response.json().catch(() => undefined);
    if (!response.ok) {
      return { ok: false, status: response.status, message: extractApiError(payload, fallbackError) };
    }
    return { ok: true, status: response.status, data: (payload?.data ?? payload) as T };
  } catch {
    return {
      ok: false,
      status: 0,
      message: 'Unable to reach the SLLAS API. Check your connection and try again.',
    };
  }
}
