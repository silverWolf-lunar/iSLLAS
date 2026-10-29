import type { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Role } from '@sllas/contracts';

const issuer = process.env.OIDC_ISSUER ?? '';
const clientId = process.env.KEYCLOAK_CLIENT_ID ?? '';
const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

function serializeError(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, serializeError(entry)]));
  }
  return value;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Government Credentials',
      credentials: {
        email: { label: 'Email or Username', type: 'text', placeholder: 'officer@sllas.gov.zw' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both your email/username and password');
        }

        if (credentials.password.trim().length === 0) {
          throw new Error('Password cannot be empty');
        }

        const apiBaseUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

        try {
          const res = await fetch(`${apiBaseUrl}/api/v1/auth/dev-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email.trim(),
              role: (credentials.role as Role) || undefined,
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Authentication failed. Please verify your credentials.');
          }

          const data = await res.json();
          const authResult = data?.data ?? data;
          if (!authResult?.token || !authResult?.user) {
            throw new Error('Invalid response from identity service');
          }

          return {
            id: authResult.user.id,
            email: authResult.user.email,
            name: `${authResult.user.firstName || ''} ${authResult.user.lastName || ''}`.trim() || authResult.user.email,
            role: authResult.user.role,
            accessToken: authResult.token,
          };
        } catch (error: any) {
          throw new Error(error.message || 'Unable to authenticate with government identity service');
        }
      },
    }),
    KeycloakProvider({
      clientId,
      clientSecret: clientSecret || '',
      issuer,
      authorization: { params: { scope: 'openid email profile' } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === 'production' ? undefined : 'local-development-only-secret-not-for-deployments'),
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/signin' },
  logger: {
    error(code, metadata) {
      const details = metadata instanceof Error
        ? serializeError(metadata)
        : serializeError(metadata);
      console.error('[SLLAS_AUTH_ERROR]', JSON.stringify({
        code,
        issuer,
        clientId,
        details,
      }));
    },
    warn(code) {
      console.warn('[SLLAS_AUTH_WARN]', code);
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 5 * 60 * 1000;
        token.error = undefined;
      }
      if (user) {
        token.sub = user.id;
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.accessTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
        token.error = undefined;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).accessToken = token.accessToken;
      }
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
};

