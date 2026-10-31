import { NextFetchEvent } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

const secret =
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  'sllas-production-session-fallback-secret-key-32chars-min';

const requireAuthentication = withAuth({
  pages: { signIn: '/signin' },
  secret,
});

export default function middleware(request: NextRequestWithAuth, event: NextFetchEvent) {
  return requireAuthentication(request, event);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/client/:path*',
    '/officer/:path*',
    '/approver/:path*',
    '/estates/:path*',
    '/audit/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/parcels/new',
    '/parcels/verify',
    '/parcels/bulk-import',
  ],
};

