import type { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

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
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 5 * 60 * 1000;
        token.error = undefined;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
};
