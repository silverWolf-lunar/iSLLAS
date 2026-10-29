import { encode, getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import type { JWT } from 'next-auth/jwt';

const allowedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const sessionMaxAge = 8 * 60 * 60;

async function proxyApiRequest(
  request: NextRequest,
  context: { params: { path: string[] } },
) {
  const expectedOrigin = new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000').origin;
  if (request.method !== 'GET' && request.headers.get('origin') !== expectedOrigin) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  if (!allowedMethods.has(request.method)) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const path = context.params.path;
  if (path.some((segment) => segment === '.' || segment === '..' || segment.includes('/'))) {
    return NextResponse.json({ error: 'Invalid API path' }, { status: 400 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  const apiBaseUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:3001';
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET must be configured');
  }

  const sessionToken = await getToken({ req: request, secret });
  if (!sessionToken || typeof sessionToken.accessToken !== 'string') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let token = sessionToken as JWT & {
    accessToken: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  };
  let refreshSession = false;

  if ((token.accessTokenExpires ?? 0) <= Date.now() + 30_000) {
    if (!token.refreshToken || !process.env.KEYCLOAK_CLIENT_ID || !process.env.KEYCLOAK_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Session expired; sign in again' }, { status: 401 });
    }

    const refreshUrl = `${process.env.OIDC_ISSUER}/protocol/openid-connect/token`;
    const refreshResponse = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
        refresh_token: token.refreshToken,
      }),
      cache: 'no-store',
    });

    if (!refreshResponse.ok) {
      return NextResponse.json({ error: 'Session expired; sign in again' }, { status: 401 });
    }

    const refreshed = await refreshResponse.json();
    if (typeof refreshed.access_token !== 'string' || typeof refreshed.expires_in !== 'number') {
      throw new Error('Keycloak returned an invalid token refresh response');
    }

    token = {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: typeof refreshed.refresh_token === 'string'
        ? refreshed.refresh_token
        : token.refreshToken,
    };
    refreshSession = true;
  }

  const targetUrl = new URL(
    `${path.join('/')}${request.nextUrl.search}`,
    `${apiBaseUrl.replace(/\/$/, '')}/`,
  );
  const headers = new Headers({
    Authorization: `Bearer ${token.accessToken}`,
    Accept: request.headers.get('accept') ?? 'application/json',
  });
  for (const headerName of ['content-type', 'x-correlation-id', 'idempotency-key']) {
    const value = request.headers.get(headerName);
    if (value) headers.set(headerName, value);
  }

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' ? undefined : await request.arrayBuffer(),
    cache: 'no-store',
    redirect: 'manual',
  });
  const responseHeaders = new Headers();
  for (const headerName of ['content-type', 'x-request-id', 'x-correlation-id']) {
    const value = upstream.headers.get(headerName);
    if (value) responseHeaders.set(headerName, value);
  }

  const response = new NextResponse(
    upstream.status === 204 || upstream.status === 304 ? null : upstream.body,
    { status: upstream.status, headers: responseHeaders },
  );

  if (refreshSession) {
    const secure = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false;
    const cookieName = secure
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';
    const encodedToken = await encode({ token, secret, maxAge: sessionMaxAge });
    response.cookies.set(cookieName, encodedToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: sessionMaxAge,
    });
  }

  return response;
}

export const GET = proxyApiRequest;
export const POST = proxyApiRequest;
export const PUT = proxyApiRequest;
export const PATCH = proxyApiRequest;
export const DELETE = proxyApiRequest;
