import { NextFetchEvent } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

const requireAuthentication = withAuth({
  pages: { signIn: '/signin' },
});

export default function middleware(request: NextRequestWithAuth, event: NextFetchEvent) {
  return requireAuthentication(request, event);
}

export const config = {
  matcher: ['/((?!signin|api/auth|api/health/auth|_next/static|_next/image|favicon.ico).*)'],
};
