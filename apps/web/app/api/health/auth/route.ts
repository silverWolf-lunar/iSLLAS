import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const issuer = process.env.OIDC_ISSUER?.replace(/\/$/, '');
  const clientId = process.env.KEYCLOAK_CLIENT_ID;

  if (!issuer || !clientId) {
    return NextResponse.json({
      status: 'ERROR',
      reason: 'OIDC_ISSUER and KEYCLOAK_CLIENT_ID must be configured',
      issuer: issuer ?? null,
      clientId: clientId ?? null,
    }, { status: 503 });
  }

  const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(discoveryUrl, { cache: 'no-store', signal: controller.signal });
    const body = await response.text();
    if (!response.ok) {
      console.error('[SLLAS_AUTH_HEALTH_ERROR]', JSON.stringify({
        discoveryUrl,
        status: response.status,
        body: body.slice(0, 500),
      }));
      return NextResponse.json({
        status: 'ERROR',
        reason: `OIDC discovery returned HTTP ${response.status}`,
        issuer,
        discoveryUrl,
      }, { status: 503 });
    }

    let discovery: { issuer?: string; authorization_endpoint?: string; token_endpoint?: string };
    try {
      discovery = JSON.parse(body);
    } catch {
      return NextResponse.json({
        status: 'ERROR',
        reason: 'OIDC discovery returned invalid JSON',
        issuer,
        discoveryUrl,
      }, { status: 503 });
    }

    if (discovery.issuer !== issuer || !discovery.authorization_endpoint || !discovery.token_endpoint) {
      return NextResponse.json({
        status: 'ERROR',
        reason: 'OIDC discovery document is missing required endpoints or issuer does not match',
        issuer,
        discoveredIssuer: discovery.issuer ?? null,
        discoveryUrl,
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'OK',
      issuer,
      clientId,
      discoveryUrl,
      authorizationEndpoint: discovery.authorization_endpoint,
      tokenEndpoint: discovery.token_endpoint,
    });
  } catch (error) {
    console.error('[SLLAS_AUTH_HEALTH_ERROR]', JSON.stringify({
      discoveryUrl,
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json({
      status: 'ERROR',
      reason: 'Unable to reach OIDC discovery endpoint',
      issuer,
      discoveryUrl,
    }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
