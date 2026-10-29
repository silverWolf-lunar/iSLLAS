import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { authOptions } from '../../../lib/auth';

function logCallbackDiagnostics(request: Request) {
  const url = new URL(request.url);
  if (!url.pathname.includes('/callback/')) return;

  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  if (error || errorDescription) {
    console.error('[SLLAS_AUTH_CALLBACK_ERROR]', JSON.stringify({
      error,
      error_description: errorDescription,
      error_uri: url.searchParams.get('error_uri'),
      provider: url.pathname.split('/callback/')[1] ?? 'unknown',
    }));
  }
}

async function withAuthDiagnostics(
  request: Request,
  context: { params: { nextauth: string[] } },
) {
  logCallbackDiagnostics(request);
  const requestUrl = new URL(request.url);
  const callbackError = requestUrl.searchParams.get('error');
  if (context.params.nextauth?.[0] === 'callback' && callbackError) {
    const reference = `AUTH-${randomUUID().slice(0, 8).toUpperCase()}`;
    console.error('[SLLAS_AUTH_CALLBACK_ERROR]', JSON.stringify({
      reference,
      provider: context.params.nextauth[1] ?? 'unknown',
      error: callbackError,
      error_description: requestUrl.searchParams.get('error_description'),
      error_uri: requestUrl.searchParams.get('error_uri'),
    }));
    return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(callbackError)}&ref=${reference}`, request.url));
  }

  if (context.params.nextauth?.[0] === 'signin' && context.params.nextauth[1] === 'keycloak') {
    const issuer = process.env.OIDC_ISSUER?.replace(/\/$/, '');
    const discoveryUrl = issuer ? `${issuer}/.well-known/openid-configuration` : null;
    if (!issuer || !process.env.KEYCLOAK_CLIENT_ID || !discoveryUrl) {
      const reference = `AUTH-${randomUUID().slice(0, 8).toUpperCase()}`;
      console.error('[SLLAS_AUTH_CONFIGURATION_ERROR]', JSON.stringify({
        reference,
        reason: 'Missing OIDC_ISSUER or KEYCLOAK_CLIENT_ID',
      }));
      return NextResponse.redirect(new URL(`/signin?error=Configuration&ref=${reference}`, request.url));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const discoveryResponse = await fetch(discoveryUrl, { cache: 'no-store', signal: controller.signal });
      if (!discoveryResponse.ok) throw new Error(`OIDC discovery returned HTTP ${discoveryResponse.status}`);
    } catch (error) {
      const reference = `AUTH-${randomUUID().slice(0, 8).toUpperCase()}`;
      console.error('[SLLAS_AUTH_CONFIGURATION_ERROR]', JSON.stringify({
        reference,
        discoveryUrl,
        reason: error instanceof Error ? error.message : String(error),
      }));
      return NextResponse.redirect(new URL(`/signin?error=Configuration&ref=${reference}`, request.url));
    } finally {
      clearTimeout(timeout);
    }
  }

  try {
    return await handler(request, context);
  } catch (error) {
    console.error('[SLLAS_AUTH_CALLBACK_EXCEPTION]', JSON.stringify({
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }));
    throw error;
  }
}

const handler = NextAuth(authOptions);

export { withAuthDiagnostics as GET, withAuthDiagnostics as POST };
